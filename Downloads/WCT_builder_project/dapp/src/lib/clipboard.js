export async function copyToClipboard(text, onSuccess, onError) {
  try {
    await navigator.clipboard.writeText(text)
    if (onSuccess) onSuccess()
    return true
  } catch (error) {
    console.error('Failed to copy:', error)
    if (onError) onError(error)
    return false
  }
}

export function CopyButton({ text, label = 'Copy', successLabel = 'Copied!', style = {} }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '6px 12px',
        borderRadius: 6,
        border: '1px solid #e5e7eb',
        background: copied ? '#10b981' : '#fff',
        color: copied ? '#fff' : '#374151',
        cursor: 'pointer',
        fontSize: 14,
        transition: 'all 0.2s',
        ...style
      }}
      title={copied ? successLabel : label}
    >
      {copied ? '✓' : '📋'} {copied ? successLabel : label}
    </button>
  )
}
