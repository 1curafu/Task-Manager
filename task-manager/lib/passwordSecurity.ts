export async function checkPasswordLeak(password: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()

    const prefix = hashHex.substring(0, 5)
    const suffix = hashHex.substring(5)

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
    
    if (!response.ok) {
      console.warn('Password leak check API unavailable')
      return false
    }

    const text = await response.text()
    const hashes = text.split('\n')

    for (const line of hashes) {
      const [hashSuffix] = line.split(':')
      if (hashSuffix === suffix) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Password leak check failed:', error)
    return false
  }
}
