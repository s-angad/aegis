'use client'
import { useRouter } from 'next/navigation'
import CommandCenterDashboard from '@/components/dashboard/CommandCenterDashboard'
import { useDemoStore } from '@/stores/demoStore'

export default function CommandCenterPage() {
  const router = useRouter()
  const { setScenarioSeed, resetDemo } = useDemoStore()

  const handleRunNewScenario = () => {
    const newSeed = Math.floor(1000 + Math.random() * 9000)
    setScenarioSeed(newSeed)
    resetDemo()
    router.push('/simulation')
  }

  return (
    <CommandCenterDashboard onRunNewScenario={handleRunNewScenario} />
  )
}
