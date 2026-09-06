import { Link } from 'react-router-dom';
import { Building2, Calendar, BarChart3, Users, Shield, ArrowRight } from 'lucide-react';

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Hero */}
      <header style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, #6366F1 100%)',
        color: 'white',
        padding: 'var(--space-8) var(--space-6)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: 'var(--max-content-width)', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 'var(--space-16)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 40, height: 40, background: 'rgba(255,255,255,0.2)',
              borderRadius: 'var(--radius-md)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Building2 size={24} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)' }}>Campus Halls</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Link to="/login" className="btn btn-ghost" style={{ color: 'white' }}>Login</Link>
            <Link to="/register" className="btn" style={{ background: 'white', color: 'var(--color-primary)' }}>Get Started</Link>
          </div>
        </div>

        <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
          <h1 style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 800, maxWidth: 700, marginBottom: 'var(--space-4)' }}>
            Centralized Seminar Hall Booking for Your Campus
          </h1>
          <p style={{ fontSize: 'var(--font-size-lg)', opacity: 0.9, maxWidth: 600, marginBottom: 'var(--space-8)' }}>
            Stop the back-and-forth. Book seminar halls in seconds. View real-time availability,
            prevent overlapping bookings, and track usage — all in one place.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: 'var(--color-primary)' }}>
              Start Booking <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-lg" style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto', padding: 'var(--space-16) var(--space-6)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
          <h2>Everything you need to manage hall bookings</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)', fontSize: 'var(--font-size-lg)' }}>
            Built for campuses with multiple institutes sharing limited seminar halls
          </p>
        </div>

        <div className="grid grid-cols-3" style={{ gap: 'var(--space-6)' }}>
          {features.map((feature, idx) => (
            <div key={idx} className="card" style={{ textAlign: 'left' }}>
              <div style={{
                width: 48, height: 48,
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 'var(--space-4)'
              }}>
                <feature.icon size={24} />
              </div>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>{feature.title}</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--color-bg-secondary)', padding: 'var(--space-16) var(--space-6)' }}>
        <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>How it works</h2>
          <div className="grid grid-cols-4" style={{ gap: 'var(--space-6)' }}>
            {steps.map((step, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56,
                  background: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  fontSize: 'var(--font-size-xl)', fontWeight: 800
                }}>
                  {idx + 1}
                </div>
                <h4 style={{ marginBottom: 'var(--space-2)' }}>{step.title}</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'var(--space-16) var(--space-6)', textAlign: 'center' }}>
        <h2>Ready to simplify your campus hall bookings?</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          Join students, faculty, and staff managing their bookings efficiently.
        </p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Create Free Account
        </Link>
      </section>

      <footer style={{
        background: 'var(--color-white)',
        padding: 'var(--space-8) var(--space-6)',
        borderTop: '1px solid var(--color-border)',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--font-size-sm)'
      }}>
        © 2026 Campus Seminar Hall Booking System. All rights reserved.
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Calendar,
    title: 'Real-time Availability',
    description: 'See which halls are available, booked, or partially occupied at a glance.'
  },
  {
    icon: Shield,
    title: 'No Double Bookings',
    description: 'Server-side validation prevents overlapping reservations. Book with confidence.'
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Track usage trends, hall utilization, peak times, and feedback ratings.'
  },
  {
    icon: Users,
    title: 'Multi-Institute Support',
    description: 'Built for campuses with multiple institutes sharing limited hall resources.'
  },
  {
    icon: Building2,
    title: 'Multiple Halls',
    description: 'Manage any number of seminar halls. Easy to add, configure, and monitor.'
  },
  {
    icon: Calendar,
    title: 'Check-in / Check-out',
    description: 'Track actual usage vs. booked time. Identify overstays and optimize scheduling.'
  }
];

const steps = [
  { title: 'Register', description: 'Create your account with your institute details' },
  { title: 'Browse Halls', description: 'View available seminar halls and their schedules' },
  { title: 'Book a Slot', description: 'Select date, time, and event details' },
  { title: 'Manage & Track', description: 'Check in, attend, give feedback, view reports' }
];
