import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../api/client.js'
import { useAuth } from './useAuth.jsx'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [circles, setCircles] = useState([])
  const [moments, setMoments] = useState([])
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [c, m, p] = await Promise.all([
        apiFetch('/circles'),
        apiFetch('/moments'),
        apiFetch('/prompts'),
      ])
      setCircles(c)
      setMoments(m)
      setPrompts(p)
    } catch (err) {
      console.error('Data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      // Attempt localStorage migration on first load
      const legacy = localStorage.getItem('dd_v1')
      if (legacy) {
        apiFetch('/migrate', { method: 'POST', body: JSON.parse(legacy) })
          .catch(() => {})
          .finally(() => localStorage.removeItem('dd_v1'))
      }
      fetchAll()
    }
  }, [user, fetchAll])

  async function addMoment(data) {
    const created = await apiFetch('/moments', { method: 'POST', body: data })
    setMoments(prev => [created, ...prev])
    return created
  }

  async function addCircle(data) {
    const created = await apiFetch('/circles', { method: 'POST', body: data })
    setCircles(prev => [...prev, created])
    return created
  }

  async function addResponse(circleId, weekKey, responseData) {
    const created = await apiFetch(`/prompts/${circleId}/${weekKey}/responses`, {
      method: 'POST',
      body: responseData,
    })
    // Refresh prompts to get updated responses
    const updated = await apiFetch('/prompts')
    setPrompts(updated)
    return created
  }

  return (
    <DataContext.Provider value={{
      circles, moments, prompts,
      addMoment, addCircle, addResponse,
      loading, refetch: fetchAll,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
