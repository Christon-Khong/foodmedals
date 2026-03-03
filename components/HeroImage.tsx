import Image from 'next/image'

export function HeroImage() {
  return (
    <div className="relative w-full h-48 sm:h-56 overflow-hidden">
      <Image
        src="/images/hero.png"
        alt="A spread of delicious food dishes"
        fill
        className="object-cover"
        priority
      />
    </div>
  )
}
