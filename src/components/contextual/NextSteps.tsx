import { Link } from 'react-router-dom'
import { ArrowRight, FileCheck, FileText, Home, Plus, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface NextStep {
  label: string
  description?: string
  href: string
  icon?: React.ElementType
  primary?: boolean
}

interface NextStepsProps {
  steps: NextStep[]
  className?: string
}

export function NextSteps({ steps, className }: NextStepsProps) {
  if (steps.length === 0) return null

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700">Next Steps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step, i) => (
          <Link
            key={i}
            to={step.href}
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors group ${
              step.primary
                ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                : 'hover:bg-gray-50'
            }`}
          >
            {step.icon && (
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                step.primary ? 'bg-blue-600' : 'bg-gray-100'
              }`}>
                <step.icon className={`h-4 w-4 ${step.primary ? 'text-white' : 'text-gray-600'}`} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${step.primary ? 'font-semibold text-blue-700' : 'font-medium text-gray-700'}`}>
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-gray-500">{step.description}</p>
              )}
            </div>
            <ArrowRight className={`h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
              step.primary ? 'text-blue-600' : 'text-gray-400'
            }`} />
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
