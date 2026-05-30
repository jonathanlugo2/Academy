import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchResources = useCallback(async (page = 1, pageSize = 10, filters = {}) => {
    setLoading(true);
    try {
      let query = supabase.from('resources').select('*', { count: 'exact' });

      // Apply filters if any (e.g., category, type)
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Mapper matching the old mockDb structure to preserve compatibility
      const mappedData = data.map(r => ({
        id: r.id,
        title: r.title,
        type: r.type,
        category: r.category,
        url: r.url,
        description: r.description,
        tags: r.tags || [],
        createdAt: r.created_at,
        storagePath: r.storage_path || null,
        isLocal: r.is_local || false
      }));

      setResources(mappedData);
      setTotalCount(count || 0);
      return { data: mappedData, count };
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createResource = async (resourceData) => {
    const dbData = {
      title: resourceData.title,
      type: resourceData.type,
      url: resourceData.url || null,
      description: resourceData.description || null,
      category: resourceData.category || 'General',
      tags: resourceData.tags || [],
      storage_path: resourceData.storagePath || null,
      is_local: resourceData.isLocal || false
    };

    const { data, error: insertError } = await supabase
      .from('resources')
      .insert([dbData])
      .select()
      .single();

    if (insertError) throw insertError;
    return data;
  };

  const updateResource = async (id, resourceData) => {
    const dbData = {};
    if (resourceData.title !== undefined) dbData.title = resourceData.title;
    if (resourceData.type !== undefined) dbData.type = resourceData.type;
    if (resourceData.url !== undefined) dbData.url = resourceData.url;
    if (resourceData.description !== undefined) dbData.description = resourceData.description;
    if (resourceData.category !== undefined) dbData.category = resourceData.category;
    if (resourceData.tags !== undefined) dbData.tags = resourceData.tags;
    if (resourceData.storagePath !== undefined) dbData.storage_path = resourceData.storagePath;
    if (resourceData.isLocal !== undefined) dbData.is_local = resourceData.isLocal;

    const { data, error: updateError } = await supabase
      .from('resources')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    return data;
  };

  const deleteResource = async (id) => {
    const { error: deleteError } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
  };

  return {
    resources,
    loading,
    error,
    totalCount,
    fetchResources,
    createResource,
    updateResource,
    deleteResource
  };
}
