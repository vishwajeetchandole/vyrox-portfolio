import { useEffect, useLayoutEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Mail,
  Layers3,
  Menu,
  MoveUpRight,
  Rocket,
  Sparkles,
  Users,
  Wand2,
  X,
} from 'lucide-react'
import { BrowserRouter, Link, Route, Routes, useLocation, useParams } from 'react-router-dom'
import AdminPage from './AdminPage'
import { challengePillars, navItems, showcase, siteConfig, teamMembers as defaultTeamMembers, technologyStack } from './data/team'
import { loadTeamMembers, saveTeamMembers } from './data/teamStorage'
import { isMemberBackup } from './data/teamValidation'
import ThemeToggle from './ThemeToggle'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="section-header mb-10 max-w-2xl">
      <p className="section-kicker mb-4 text-[10px] font-medium uppercase tracking-[0.42em] text-violet-200/80">{eyebrow}</p>
      <h2 className="section-title font-display text-4xl font-semibold tracking-[-0.06em] text-[#F8F7FC] md:text-5xl">{title}</h2>
      {description ? <p className="mt-4 text-base text-[#A6A0B5] md:text-lg">{description}</p> : null}
    </div>
  )
}

function Header({ theme, onToggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07060B]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="font-display text-xl font-semibold tracking-[0.26em] text-white">
          {siteConfig.brand}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="nav-link text-[10px] font-medium uppercase tracking-[0.3em] text-[#A6A0B5] transition hover:text-white">
              {item.label}
            </a>
          ))}
          <Link to="/admin" className="nav-link text-[10px] font-medium uppercase tracking-[0.3em] text-violet-200 transition hover:text-white">
            Admin
          </Link>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            type="button"
            aria-label="Toggle navigation"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-[#0d0914] md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#D8D2EC]"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link to="/admin" className="text-[10px] font-medium uppercase tracking-[0.3em] text-violet-200" onClick={() => setMobileOpen(false)}>
              Admin
            </Link>
            <Link to="/" className="text-[10px] font-medium uppercase tracking-[0.3em] text-white" onClick={() => setMobileOpen(false)}>
              HOME
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}

function Footer({ teamMembers }) {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#090611]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <p className="font-display text-2xl tracking-[0.18em] text-white">{siteConfig.brand}</p>
          <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.26em] text-violet-200/80">{siteConfig.tagline}</p>
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-[#A6A0B5]">Navigation</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-[#D9D5E8]">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-[#A6A0B5]">Profile links</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-[#D9D5E8]">
            {teamMembers.map((member) => (
              <Link key={member.slug} to={`/team/${member.slug}`} className="transition hover:text-white">
                {member.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 text-xs text-[#A6A0B5] sm:px-6 lg:px-8">
          <p>Built for Triwizathon 2026</p>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white transition hover:border-violet-300/50 hover:bg-violet-500/10"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Back to top <MoveUpRight size={14} />
          </button>
        </div>
      </div>
    </footer>
  )
}

function SocialIcon({ label }) {
  if (label === 'Gmail') return <Mail size={18} aria-hidden="true" />
  if (label === 'Portfolio') return <Globe size={18} aria-hidden="true" />

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
      {label === 'LinkedIn' ? (
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56c0 .95.79 1.72 1.77 1.72h20.45c.98 0 1.78-.77 1.78-1.72V1.72c0-.95-.8-1.72-1.78-1.72Z" />
      ) : (
        <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.53v-2.08c-3.1.68-3.76-1.32-3.76-1.32-.5-1.29-1.24-1.63-1.24-1.63-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.71 2.62 1.22 3.25.93.1-.72.39-1.22.71-1.5-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.21 1.16-2.99-.12-.28-.5-1.42.11-2.95 0 0 .95-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.67.11 2.95.72.78 1.16 1.77 1.16 2.99 0 4.29-2.61 5.24-5.1 5.51.4.35.75 1.02.75 2.06V22c0 .29.2.63.76.52A11.1 11.1 0 0 0 12 .9Z" />
      )}
    </svg>
  )
}

function HomePage({ teamMembers, theme, onToggleTheme }) {
  const [activeProject, setActiveProject] = useState(showcase[0])

  const stats = [
    { value: '03', label: 'creative minds' },
    { value: '07+', label: 'core strengths' },
    { value: '24/7', label: 'idea fuel' },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07060B] text-[#F8F7FC]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.25),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(192,132,252,0.14),_transparent_32%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:72px_72px]" />
      <Header theme={theme} onToggleTheme={onToggleTheme} />

      <main className="relative z-10">
        <section id="home" className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="min-w-0">
              <div className="mb-7 flex flex-wrap items-center gap-4">
                <div className="soft-pill inline-flex items-center gap-3 rounded-full border border-white/10 bg-[#120B1B]/80 p-2 pr-4 shadow-[0_0_30px_rgba(139,92,246,0.12)]">
                  <img src={siteConfig.eventBadge} alt="Triwizathon 2026 logo" className="h-12 w-12 rounded-2xl border border-white/10 bg-[#170B2E]/80 object-cover" />
                  <div className="min-w-0 text-left">
                    <p className="text-[10px] uppercase tracking-[0.26em] text-[#A6A0B5]">Triwizathon 2026</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-violet-100">Sanjay Ghodawat University</p>
                  </div>
                </div>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
                className="font-display text-5xl font-semibold uppercase tracking-[-0.08em] text-white sm:text-6xl lg:text-[7rem]"
              >
                {siteConfig.brand}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.25, ease: 'easeOut' }}
                className="mt-6 text-base font-medium uppercase tracking-[0.22em] text-violet-100 sm:text-lg"
              >
                {siteConfig.tagline}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.35, ease: 'easeOut' }}
                className="mt-5 max-w-xl text-base text-[#A6A0B5] md:text-lg"
              >
                {siteConfig.supportLine}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.45, ease: 'easeOut' }}
                className="mt-6 max-w-xl text-lg text-[#D5CEDF]"
              >
                {siteConfig.heroIntro}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.52, ease: 'easeOut' }}
                className="mt-8 flex flex-wrap items-center gap-4"
              >
                <a href="#team" className="cta-primary inline-flex items-center gap-2 rounded-full bg-violet-500 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white shadow-[0_12px_40px_rgba(139,92,246,0.5)] transition hover:-translate-y-0.5 hover:bg-violet-400">
                  Meet the team <ArrowRight size={16} />
                </a>
                <a href="#strength" className="cta-secondary inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#F8F7FC] transition hover:border-violet-300/50 hover:bg-violet-500/10">
                  Why VYROX?
                </a>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 flex flex-wrap gap-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="stat-card rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                    <span className="block text-lg font-semibold text-white">{stat.value}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#A6A0B5]">{stat.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.25, ease: 'easeOut' }} className="relative flex min-h-[420px] min-w-0 items-center justify-center">
              <div className="hero-orb floating-orb" aria-hidden="true" />
              <div className="absolute inset-6 rounded-[2rem] border border-violet-300/10 bg-white/[0.02] backdrop-blur-sm" />
              <div className="orb-panel relative z-10 w-full max-w-md rounded-[2rem] border border-violet-300/10 bg-[#120B1C]/80 p-6 shadow-[0_0_60px_rgba(139,92,246,0.2)]">
                <div className="flex items-center justify-between px-1 pb-5 text-[10px] uppercase tracking-[0.26em] text-[#A6A0B5]">
                  <span>Collective energy</span>
                  <Sparkles size={16} className="text-violet-200" />
                </div>
                <div className="signal-grid grid grid-cols-3 gap-3">
                  {teamMembers.map((member) => (
                    <motion.div
                      key={member.slug}
                      whileHover={{ y: -8, scale: 1.03 }}
                      className="member-mini rounded-2xl border border-white/10 bg-[#1A1129] p-3 text-center"
                    >
                      <div className="mb-3 flex h-16 items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_top,_rgba(192,132,252,0.52),_rgba(139,92,246,0.22)_30%,_rgba(7,6,11,0))] text-lg font-semibold tracking-[0.15em] text-white">
                        {member.image ? (
                          <img src={member.image} alt={`Photo of ${member.name}`} className="h-full w-full object-cover" />
                        ) : (
                          member.initials
                        )}
                      </div>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-violet-100">{member.name}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-violet-300/15 bg-violet-500/5 p-4 text-sm text-[#D5CEDF]">
                  Three perspectives. One shared ambition for a meaningful build.
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="border-y border-white/10 bg-[#0d0914]/90">
          <div className="marquee-track py-3 text-[10px] font-medium uppercase tracking-[0.38em] text-violet-100/80">
            {[...Array(2)].flatMap(() => ['Design systems', 'Product thinking', 'Creative engineering', 'Rapid prototyping', 'Research loops', 'Human-centered ideas']).map((item, index) => (
              <span key={`${item}-${index}`} className="mx-6 inline-flex items-center gap-3">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-300" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <section id="team" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="Meet the team"
            title="THREE MINDS. DIFFERENT STRENGTHS."
            description="Each member adds a distinct creative lens, technical instinct, and execution rhythm to the project."
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {teamMembers.map((member, index) => (
              <Link
                key={member.slug}
                to={`/team/${member.slug}`}
                className="group block rounded-[2rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300"
              >
                <motion.article
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  whileHover={{ y: -8, scale: 1.01 }}
                  className="member-card rounded-[2rem] border border-white/10 bg-[#100B18]/80 p-4 shadow-[0_0_40px_rgba(139,92,246,0.06)]"
                >
                  <div className="overflow-hidden rounded-[1.5rem] border border-violet-300/15 bg-[radial-gradient(circle_at_top,_rgba(192,132,252,0.4),_rgba(17,10,27,0.9)_52%)] p-4">
                    <div className="flex h-64 items-center justify-center overflow-hidden rounded-[1.25rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_rgba(7,6,11,0.2))] text-5xl font-semibold tracking-[0.18em] text-white/90">
                      {member.image ? (
                        <img src={member.image} alt={`Photo of ${member.name}`} className="h-full w-full object-cover" />
                      ) : (
                        member.initials
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-violet-200/80">{member.role}</p>
                      <h3 className="mt-2 font-display text-3xl font-semibold text-white">{member.name}</h3>
                    </div>
                    <span className="rounded-full border border-violet-300/20 bg-violet-500/10 p-2 text-violet-100">
                      <ArrowRight size={16} />
                    </span>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-[#A6A0B5]">{member.aboutMe}</p>

                  <ul className="mt-5 space-y-2 text-sm text-[#D8D0EA]">
                    {member.strengths.map((strength) => (
                      <li key={strength} className="flex gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-violet-300" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex justify-between border-t border-white/10 pt-4">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-[#A6A0B5]">Creative profile</span>
                    <span className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-violet-200 transition group-hover:text-white">
                      Explore profile <ExternalLink size={12} />
                    </span>
                  </div>
                </motion.article>
              </Link>
            ))}
          </div>
        </section>

        <section id="strength" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="Collective strength"
            title="OUR STRENGTH LIES IN THE SPACE BETWEEN IDEAS AND EXECUTION."
            description="VYROX blends strategic clarity with creative energy to turn high-potential concepts into polished outcomes."
          />

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {challengePillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                whileHover={{ y: -8 }}
                className="pillar-card rounded-[1.8rem] border border-violet-300/10 bg-[#110C18]/80 p-5"
              >
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-violet-300/25 bg-violet-500/10 text-violet-100">
                  {index === 0 ? <Layers3 size={18} /> : index === 1 ? <BrainCircuit size={18} /> : index === 2 ? <Users size={18} /> : <Rocket size={18} />}
                </div>
                <h3 className="font-display text-2xl text-white">{pillar.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#A6A0B5]">{pillar.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="stack" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="Tech arsenal"
            title="TOOLS ARE OUR SPELLS."
            description="The stack is intentionally flexible and polished for the real work, not just the pitch deck."
          />

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {technologyStack.map((group) => (
              <motion.div key={group.title} whileHover={{ y: -6 }} className="tool-card rounded-[1.8rem] border border-white/10 bg-[#100B18]/80 p-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-violet-200/80">{group.title}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span key={item} className="rounded-full border border-violet-300/15 bg-violet-500/5 px-3 py-2 text-xs font-medium text-[#E7E0F8]">
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="work" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="Projects, achievements & experiences"
            title="REAL WORK. REAL LEARNING. REAL MOMENTS."
            description="Selected concepts that show how the team thinks, experiments, and builds with intent."
          />

          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-4">
              {showcase.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setActiveProject(item)}
                  className={`showcase-card w-full rounded-[1.6rem] border p-5 text-left transition ${activeProject.title === item.title ? 'border-violet-300/40 bg-violet-500/10 shadow-[0_0_30px_rgba(139,92,246,0.18)]' : 'border-white/10 bg-[#120D1C]/90 hover:border-violet-300/30'}`}
                >
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.26em] text-[#A6A0B5]">
                    <span>{item.category}</span>
                    <Wand2 size={15} className="text-violet-200" />
                  </div>
                  <h3 className="mt-5 font-display text-2xl text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#A6A0B5]">{item.summary}</p>
                </button>
              ))}
            </div>

            <motion.div
              key={activeProject.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="showcase-spotlight rounded-[2rem] border border-violet-300/15 bg-[linear-gradient(135deg,_rgba(139,92,246,0.18),_rgba(9,6,17,0.9)_35%,_rgba(17,10,27,0.9)_100%)] p-6 md:p-8"
            >
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-violet-100/80">
                <span>{activeProject.category}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">Featured</span>
              </div>
              <h3 className="mt-6 font-display text-4xl text-white md:text-5xl">{activeProject.title}</h3>
              <p className="mt-5 max-w-xl text-base leading-8 text-[#E5DDF9]">{activeProject.summary}</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {activeProject.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-violet-100">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-[#A6A0B5]">Focus</p>
                  <p className="mt-3 text-base font-medium text-white">Narrative clarity</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-[#A6A0B5]">Approach</p>
                  <p className="mt-3 text-base font-medium text-white">Rapid iteration</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-[#A6A0B5]">Outcome</p>
                  <p className="mt-3 text-base font-medium text-white">Memorable product</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-20">
          <div className="rounded-[2.5rem] border border-violet-300/15 bg-[linear-gradient(135deg,_rgba(139,92,246,0.15),_rgba(9,6,17,0.9)_40%,_rgba(19,13,30,0.9))] p-6 md:p-10">
            <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-violet-200/80">Why VYROX deserves Round 2</p>
            <h2 className="mt-5 max-w-4xl font-display text-4xl font-semibold tracking-[-0.06em] text-white md:text-6xl">
              GIVE US A CHALLENGE. WE&apos;LL GIVE IT EVERYTHING.
            </h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <div>
                <p className="text-sm leading-7 text-[#DCD4EE]">
                  We are a team with different strengths, complementary instincts, and a willingness to learn quickly when the problem is unfamiliar.
                </p>
              </div>
              <div>
                <p className="text-sm leading-7 text-[#DCD4EE]">
                  The work we build is rooted in experimentation, practical thinking, and communication between technical and creative disciplines.
                </p>
              </div>
              <div>
                <p className="text-sm leading-7 text-[#DCD4EE]">
                  Our goal is not just to participate — it is to build something thoughtful, useful, and memorable through collaborative execution.
                </p>
              </div>
            </div>

            <p className="mt-10 text-2xl font-medium uppercase tracking-[0.08em] text-white md:text-4xl">
              WE&apos;RE NOT HERE JUST TO PARTICIPATE. WE&apos;RE HERE TO CREATE SOMETHING THAT MATTERS.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#team" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#07060B] transition hover:-translate-y-0.5">
                Meet the team <ArrowRight size={16} />
              </a>
              <Link to="/team/member-one" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white transition hover:border-violet-200/50 hover:bg-violet-500/10">
                View profile <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-12">
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.34em] text-violet-200/80">VYROX</p>
            <h2 className="mt-4 font-display text-5xl font-semibold uppercase tracking-[-0.08em] text-white md:text-7xl">{siteConfig.brand}</h2>
            <p className="mt-6 text-base font-medium uppercase tracking-[0.2em] text-violet-100 md:text-lg">{siteConfig.tagline}</p>
            <p className="mt-5 text-base text-[#A6A0B5]">Turning bold ideas into real, valuable outcomes.</p>
          </div>
        </section>
      </main>

      <Footer teamMembers={teamMembers} />
    </div>
  )
}

function ProfilePage({ teamMembers, theme, onToggleTheme }) {
  const { memberSlug } = useParams()
  const memberIndex = teamMembers.findIndex((member) => member.slug === memberSlug)
  const member = teamMembers[memberIndex]

  if (!member) {
    return (
      <div className="min-h-screen bg-[#07060B] text-white">
        <header className="border-b border-white/10 bg-[#07060B]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link to="/" className="font-display text-xl tracking-[0.26em] text-white">VYROX</Link>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </header>
        <div className="px-4 py-20">
          <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-[#120D1C] p-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.32em] text-violet-200/80">Profile not found</p>
          <h1 className="mt-4 font-display text-4xl">Member profile unavailable</h1>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-violet-500 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-white">
            Back to VYROX <ArrowRight size={16} />
          </Link>
          </div>
        </div>
      </div>
    )
  }

  const prevMember = teamMembers[(memberIndex - 1 + teamMembers.length) % teamMembers.length]
  const nextMember = teamMembers[(memberIndex + 1) % teamMembers.length]
  const recognitionItems = [
    ...(member.achievements || []).map((achievement, index) => ({ ...achievement, kind: 'achievement', index, label: 'Achievement' })),
    ...(member.certificates || []).map((certificate, index) => ({ ...certificate, kind: 'certificate', index, label: 'Certificate' })),
  ]
  const socialLinks = [
    { label: 'Gmail', value: member.links?.email, href: member.links?.email ? `mailto:${member.links.email}` : '' },
    { label: 'LinkedIn', value: member.links?.linkedin, href: member.links?.linkedin },
    { label: 'GitHub', value: member.links?.github, href: member.links?.github },
    { label: 'Portfolio', value: member.links?.portfolio, href: member.links?.portfolio },
  ]
  const isAvailableLink = (value) => Boolean(value && value !== '#')
  const visibleSocialLinks = socialLinks.filter(({ label, value }) => label !== 'Portfolio' || isAvailableLink(value))
  const renderSection = (section) => {
    if (section === 'projects') {
      return (
        <section key="projects" id="profile-projects" className="scroll-mt-36">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-violet-200/80">Selected work</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">Projects</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-[#A6A0B5]">{member.projects.length} projects</span>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {member.projects.map((project, index) => (
              <motion.article
                key={`${project.title}-${index}`}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#100B18]/85 transition duration-300 hover:-translate-y-1 hover:border-violet-300/30 hover:shadow-[0_18px_45px_rgba(88,63,130,0.16)]"
              >
                {project.image ? (
                  <img src={project.image} alt={`${project.title} project`} className="aspect-[16/9] w-full border-b border-white/10 object-cover" />
                ) : (
                  <div className="flex aspect-[16/9] items-end border-b border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(192,132,252,0.2),_transparent_45%),linear-gradient(135deg,#1c1229,#0c0913)] p-5">
                    <span className="rounded-full border border-violet-300/20 bg-black/20 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-violet-100">Featured project</span>
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-display text-xl font-semibold text-white transition group-hover:text-violet-100">{project.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#A6A0B5]">{project.description}</p>
                  {(project.techStack || project.tags || []).length ? (
                    <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${project.title} technologies`}>
                      {(project.techStack || project.tags || []).map((tag) => (
                        <li key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-violet-100">{tag}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </motion.article>
            ))}
            {!member.projects.length ? <p className="text-sm text-[#A6A0B5]">No projects added yet.</p> : null}
          </div>
        </section>
      )
    }

    return (
      <section key="achievements" id="profile-recognition" className="scroll-mt-36">
        <div className="mb-6">
          <p className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.3em] text-violet-200/80"><BadgeCheck size={14} /> Milestones</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">Achievements &amp; certificates</h2>
        </div>
        {recognitionItems.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recognitionItems.map((item) => (
              <motion.article
                key={`${item.kind}-${item.title}-${item.index}`}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.35 }}
                className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#100B18]/85 transition duration-300 hover:-translate-y-1 hover:border-violet-300/30 hover:shadow-[0_18px_45px_rgba(88,63,130,0.14)]"
              >
                {item.image ? (
                  <img src={item.image} alt={`${item.title} ${item.label.toLowerCase()}`} className="max-h-72 w-full border-b border-white/10 bg-black/20 object-contain" />
                ) : (
                  <div className="flex h-28 items-center justify-center border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(192,132,252,0.16),_transparent_65%)] text-violet-200">
                    <BadgeCheck size={30} strokeWidth={1.4} />
                  </div>
                )}
                <div className="p-5">
                  <span className="inline-flex rounded-full border border-violet-300/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-violet-100">{item.label}</span>
                  <h3 className="mt-3 font-display text-xl font-semibold text-white">{item.title}</h3>
                  {item.description ? <p className="mt-2 text-sm leading-7 text-[#A6A0B5]">{item.description}</p> : null}
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-[#A6A0B5]">No achievements or certificates added yet.</div>
        )}
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-[#07060B] text-white">
      <header className="border-b border-white/10 bg-[#07060B]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="font-display text-xl tracking-[0.26em] text-white">VYROX</Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <Link to="/" aria-label="Back to VYROX" className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-violet-100 transition hover:text-white">
              <ChevronLeft size={16} /> <span className="hidden sm:inline">Back to VYROX</span>
            </Link>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pb-28 lg:pt-14">
        <section aria-labelledby="member-name" className="grid items-center gap-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(24,15,38,0.96),rgba(12,9,19,0.94))] p-4 shadow-[0_24px_80px_rgba(88,63,130,0.14)] sm:p-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12 lg:p-8">
          <div className="relative min-w-0 overflow-hidden rounded-[1.5rem] border border-violet-300/15 bg-[radial-gradient(circle_at_top,_rgba(192,132,252,0.32),_rgba(17,10,27,0.9)_54%)] p-3">
            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.15rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_rgba(7,6,11,0.2))] text-7xl font-semibold tracking-[0.18em] text-white/90 sm:aspect-[5/4] lg:aspect-[4/5]">
              {member.image ? (
                <img src={member.image} alt={`Photo of ${member.name}`} className="h-full w-full object-cover" />
              ) : (
                member.initials
              )}
            </div>
          </div>

          <div className="min-w-0 py-2 lg:py-5">
            <p className="inline-flex rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-violet-100">{member.role}</p>
            <h1 id="member-name" className="mt-5 font-display text-4xl font-semibold tracking-[-0.07em] text-white sm:text-5xl lg:text-6xl">{member.name}</h1>
            <p className="mt-3 text-lg text-[#DCD4EE] sm:text-xl">{member.title}</p>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#A6A0B5] sm:text-base sm:leading-8">{member.intro}</p>

            <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
              {visibleSocialLinks.map(({ label, value, href }) => {
                const available = isAvailableLink(value)
                const content = (
                  <SocialIcon label={label} />
                )

                return available ? (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    title={label}
                    target={label === 'Gmail' ? undefined : '_blank'}
                    rel={label === 'Gmail' ? undefined : 'noreferrer'}
                    className="group inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-violet-100 transition hover:-translate-y-0.5 hover:border-violet-300/40 hover:bg-violet-500/[0.08] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300"
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    key={label}
                    aria-disabled="true"
                    aria-label={`${label} link not configured`}
                    title={`${label} link not configured`}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] text-violet-100 opacity-45"
                  >
                    {content}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <nav aria-label="Member profile sections" className="profile-section-nav fixed bottom-4 left-1/2 z-40 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#100B18]/95 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="profile-section-nav__items flex gap-2 overflow-x-auto">
            {[
              { label: 'About', href: '#profile-about' },
              { label: 'Projects', href: '#profile-projects' },
              { label: 'Achievements & certificates', href: '#profile-recognition' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#D9D4ED] transition hover:border-violet-300/40 hover:bg-violet-500/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="mt-12 space-y-12 sm:mt-16 sm:space-y-16">
          <section id="profile-about" className="scroll-mt-36">
            <div className="mb-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-violet-200/80">More about the member</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">About</h2>
            </div>
            <article className="rounded-[1.5rem] border border-white/10 bg-[#100B18]/85 p-6 sm:p-7">
              <p className="text-sm leading-7 text-[#A6A0B5]">{member.aboutMe}</p>
              <h3 className="mt-7 text-[10px] font-medium uppercase tracking-[0.25em] text-violet-200/80">Core strengths</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {member.strengths.map((strength) => (
                  <li key={strength} className="rounded-full border border-violet-300/15 bg-violet-500/[0.07] px-3 py-1.5 text-xs text-[#D9D4ED]">{strength}</li>
                ))}
              </ul>
            </article>
          </section>

          {['projects', 'achievements'].map((section) => renderSection(section))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Link to={`/team/${prevMember.slug}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white">
            <ChevronLeft size={15} /> Previous member
          </Link>
          <Link to={`/team/${nextMember.slug}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white">
            Next member <ChevronRight size={15} />
          </Link>
        </div>
      </main>
    </div>
  )
}

function AppShell() {
  const location = useLocation()
  const [teamMembers, setTeamMembers] = useState(loadTeamMembers)
  const [backendReady, setBackendReady] = useState(() => import.meta.env.DEV ? false : null)
  const [editorToken, setEditorToken] = useState(() => window.sessionStorage.getItem('vyrox-editor-token') || '')
  const [theme, setTheme] = useState(() => (
    window.localStorage.getItem('vyrox-theme') === 'light' ? 'light' : 'dark'
  ))

  useEffect(() => {
    if (import.meta.env.DEV) {
      return undefined
    }

    let isCurrent = true

    async function loadSharedProfiles() {
      try {
        const statusResponse = await fetch('/api/team', { cache: 'no-store' })
        const status = await statusResponse.json()
        if (!statusResponse.ok) {
          throw new Error(status.error || 'The shared profile service could not be reached.')
        }
        if (!status.backendReady) {
          if (isCurrent) setBackendReady(false)
          return
        }

        const profilesResponse = await fetch('/team-members.json', { cache: 'no-store' })
        if (!profilesResponse.ok) {
          throw new Error(`Could not load the shared profiles (HTTP ${profilesResponse.status}).`)
        }
        const latestMembers = await profilesResponse.json()
        if (!isMemberBackup(latestMembers, defaultTeamMembers)) {
          throw new Error('The shared profile file is invalid or does not match this team.')
        }

        if (isCurrent) {
          setTeamMembers(latestMembers)
          setBackendReady(true)
          try {
            saveTeamMembers(latestMembers)
          } catch (storageError) {
            console.error('Could not cache the shared VYROX profiles in this browser.', storageError)
          }
        }
      } catch (loadError) {
        console.error('Could not load shared VYROX profiles.', loadError)
        if (isCurrent) setBackendReady(false)
      }
    }

    loadSharedProfiles()
    return () => {
      isCurrent = false
    }
  }, [])

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem('vyrox-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')
  }

  async function authenticateEditor(username, password) {
    const expectedUsername = 'member'

    if (username !== expectedUsername || !password) {
      throw new Error('Incorrect username or password.')
    }

    if (backendReady) {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${password}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'authenticate' }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || 'Could not authenticate with the shared profile service.')
      }
    }

    window.sessionStorage.setItem('vyrox-editor-token', password)
    setEditorToken(password)
  }

  function logoutEditor() {
    window.sessionStorage.removeItem('vyrox-editor-token')
    setEditorToken('')
  }

  async function hashProfile(member) {
    const data = new TextEncoder().encode(JSON.stringify(member))
    const digest = await window.crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  async function persistTeamMembers(members, { memberSlug, baseMember, replaceAll } = {}) {
    if (!backendReady) {
      saveTeamMembers(members)
      setTeamMembers(members)
      return { members, remote: false }
    }

    if (!editorToken) {
      throw new Error('Sign in again before saving shared profiles.')
    }

    let body
    if (memberSlug) {
      const member = members.find((item) => item.slug === memberSlug)
      if (!member || !baseMember) throw new Error('Could not find the selected team member profile.')
      body = { action: 'save-member', member, baseHash: await hashProfile(baseMember) }
    } else if (replaceAll) {
      body = { action: 'replace-team', members }
    } else {
      throw new Error('The profile save request is incomplete.')
    }

    const response = await fetch('/api/team', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${editorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(result.error || 'Could not save the shared team profiles.')
    }
    if (!isMemberBackup(result.members, defaultTeamMembers)) {
      throw new Error('The shared profile service returned invalid profile data.')
    }

    setTeamMembers(result.members)
    try {
      saveTeamMembers(result.members)
    } catch (storageError) {
      console.error('The shared profiles were saved, but could not be cached in this browser.', storageError)
    }
    return { members: result.members, remote: true }
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage teamMembers={teamMembers} theme={theme} onToggleTheme={toggleTheme} />} />
          <Route path="/team/:memberSlug" element={<ProfilePage teamMembers={teamMembers} theme={theme} onToggleTheme={toggleTheme} />} />
          <Route
            path="/admin"
            element={backendReady === null
              ? <main className="min-h-screen bg-[#07060B] p-8 text-sm text-[#D9D4ED]">Connecting to the shared profile service…</main>
              : (
                <AdminPage
                  members={teamMembers}
                  onSave={persistTeamMembers}
                  theme={theme}
                  onToggleTheme={toggleTheme}
                  backendReady={backendReady}
                  editorToken={editorToken}
                  onAuthenticate={authenticateEditor}
                  onLogout={logoutEditor}
                />
              )}
          />
        </Routes>
      </AnimatePresence>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppShell />
    </BrowserRouter>
  )
}
