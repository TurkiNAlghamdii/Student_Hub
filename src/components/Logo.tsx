import Image from 'next/image'

export default function Logo() {
  return (
    <div className="logo-wrapper">
      <Image
        src="/bitmap.svg"
        alt="Student Hub Logo"
        width={200}
        height={200}
        priority
        quality={100}
      />
    </div>
  )
} 