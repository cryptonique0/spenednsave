import React, { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useToast } from './Toast'

export default function UserProfile() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const toast = useToast()
  const [ensName, setEnsName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [reputation, setReputation] = useState(0)
  const [socialLinks, setSocialLinks] = useState({ twitter: '', discord: '' })

  useEffect(() => {
    const fetchProfile = async () => {
      if (!address) return
      try {
        // Fetch ENS name
        const name = await publicClient.getEnsName({ address })
        setEnsName(name || '')

        // Placeholder for avatar and reputation
        setAvatar('https://via.placeholder.com/100') // Replace with NFT avatar logic
        setReputation(100) // Placeholder
      } catch (error) {
        console.error(error)
      }
    }
    fetchProfile()
  }, [address, publicClient])

  const updateSocial = (platform, value) => {
    setSocialLinks({ ...socialLinks, [platform]: value })
  }

  return (
    <div style={{ marginTop: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <h3>User Profile</h3>
      {avatar && <img src={avatar} alt="Avatar" style={{ width: 100, height: 100, borderRadius: '50%' }} />}
      <p><strong>Address:</strong> {address}</p>
      <p><strong>ENS Name:</strong> {ensName || 'None'}</p>
      <p><strong>Reputation Score:</strong> {reputation}</p>
      <div>
        <label>Twitter:</label>
        <input
          type="text"
          value={socialLinks.twitter}
          onChange={(e) => updateSocial('twitter', e.target.value)}
          style={{ padding: 4, borderRadius: 4, marginLeft: 8 }}
        />
      </div>
      <div style={{ marginTop: 8 }}>
        <label>Discord:</label>
        <input
          type="text"
          value={socialLinks.discord}
          onChange={(e) => updateSocial('discord', e.target.value)}
          style={{ padding: 4, borderRadius: 4, marginLeft: 8 }}
        />
      </div>
      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
        Note: Avatar and reputation are placeholders. Integrate with NFT contracts and reputation systems.
      </p>
    </div>
  )
}