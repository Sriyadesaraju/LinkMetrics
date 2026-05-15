interface SectionHeadingProps {
  eyebrow?: string
  title: string
  titleAccent?: string
  description?: string
  align?: 'center' | 'left'
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  titleAccent,
  description,
  align = 'center',
  className = '',
}: SectionHeadingProps) {
  return (
    <div className={`reveal-up ${align === 'center' ? 'text-center mx-auto max-w-3xl' : ''} ${className}`}>
      {eyebrow && (
        <p className="text-sm font-semibold text-sky-600 uppercase tracking-widest mb-4">{eyebrow}</p>
      )}
      <h2 className="big-headline font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-navy-900 leading-[1.08]">
        <span className="headline-word inline-block">{title}</span>
        {titleAccent && (
          <>
            {' '}
            <span className="headline-word inline-block text-gradient-brand">{titleAccent}</span>
          </>
        )}
      </h2>
      {description && (
        <p className={`mt-5 text-lg text-muted leading-relaxed ${align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-xl'}`}>
          {description}
        </p>
      )}
    </div>
  )
}
