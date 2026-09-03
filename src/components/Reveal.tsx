import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Reveal — wraps children in a scroll-triggered entrance.
 * Fades + rises the content the first time it enters the viewport.
 *
 * Usage:
 *   <Reveal delay={2}>...</Reveal>            // stagger with delay class 1..8
 *   <Reveal as="div" className="...">...</Reveal>
 *
 * Respects prefers-reduced-motion via CSS (reveal stays visible).
 */
export default function Reveal({
  children,
  delay,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  delay?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  className?: string
  as?: keyof React.JSX.IntrinsicElements
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Fallback for very old browsers / SSR-less edge: show immediately
    if (typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reveal content immediately when IO unsupported
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            io.disconnect()
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const delayClass = delay && delay >= 1 && delay <= 8 ? ` reveal-delay-${delay}` : ''

  return (
    // @ts-expect-error — dynamic tag render
    <Tag
      ref={ref}
      className={`${visible ? 'reveal-visible' : 'reveal'}${delayClass}${className ? ` ${className}` : ''}`}
    >
      {children}
    </Tag>
  )
}
