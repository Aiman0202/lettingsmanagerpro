import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GitBranch, Plus, Info } from 'lucide-react'

interface ConditionalBlocksPanelProps {
  onInsertBlock: (blockHtml: string) => void
}

// Pre-built conditional blocks for AST agreements
const CONDITIONAL_BLOCKS = [
  {
    id: 'pets-conditional',
    title: 'If Pets Allowed',
    condition: '{{pets_allowed}} = Yes',
    description: 'Show pet clause only when pets are permitted',
    html: `<!-- IF {{pets_allowed}} = "Yes" -->
<h3>Pets Permission</h3>
<p>The Landlord grants permission for the Tenant to keep the following pet(s) at the Property: <strong>{{pet_details}}</strong>.</p>
<p>The Tenant agrees to ensure the pet(s) do not cause nuisance and to have the Property professionally cleaned at the end of the tenancy.</p>
<!-- ENDIF -->`
  },
  {
    id: 'furnished-conditional',
    title: 'If Furnished Property',
    condition: '{{property_type}} = Furnished',
    description: 'Show inventory clause for furnished properties',
    html: `<!-- IF {{property_type}} = "Furnished" -->
<h3>Furnished Property Inventory</h3>
<p>The Property is let furnished. An Inventory and Schedule of Condition has been prepared listing all furniture, fixtures, and fittings provided.</p>
<p>The Tenant acknowledges receipt of a copy of the Inventory and agrees to return all items in the same condition as at the start, fair wear and tear excepted.</p>
<!-- ENDIF -->`
  },
  {
    id: 'parking-conditional',
    title: 'If Parking Included',
    condition: '{{parking_included}} = Yes',
    description: 'Show parking terms when parking is provided',
    html: `<!-- IF {{parking_included}} = "Yes" -->
<h3>Parking</h3>
<p>The Tenant is granted permission to use the following parking space(s): <strong>{{parking_details}}</strong>.</p>
<p>This permission is personal to the Tenant and may not be transferred or sublet. The Tenant shall not use the parking space for storage or any purpose other than parking a motor vehicle.</p>
<!-- ENDIF -->`
  },
  {
    id: 'garden-conditional',
    title: 'If Garden Included',
    condition: '{{garden_included}} = Yes',
    description: 'Show garden maintenance clause',
    html: `<!-- IF {{garden_included}} = "Yes" -->
<h3>Garden Maintenance</h3>
<p>The Tenant is granted use of the garden area and agrees to:</p>
<ul>
<li>Keep the garden in a tidy condition</li>
<li>Regularly mow lawns during growing seasons</li>
<li>Not plant trees or shrubs without the Landlord's consent</li>
<li>Not erect fences, sheds, or other structures</li>
</ul>
<!-- ENDIF -->`
  },
  {
    id: 'bills-included-conditional',
    title: 'If Bills Included',
    condition: '{{bills_included}} = Yes',
    description: 'Show utilities included clause',
    html: `<!-- IF {{bills_included}} = "Yes" -->
<h3>Bills Included</h3>
<p>The rent includes the following utilities: <strong>{{included_bills}}</strong>.</p>
<p>The Tenant agrees to use utilities reasonably and not waste any included services. The Landlord reserves the right to review the rent if utility costs increase significantly.</p>
<!-- ENDIF -->`
  },
  {
    id: 'students-conditional',
    title: 'If Student Tenants',
    condition: '{{tenant_type}} = Student',
    description: 'Show guarantor clause for student tenants',
    html: `<!-- IF {{tenant_type}} = "Student" -->
<h3>Guarantor Requirement</h3>
<p>As the Tenant is a student, a guarantor is required. The guarantor must:</p>
<ul>
<li>Be a UK homeowner</li>
<li>Provide proof of income and identity</li>
<li>Sign a Deed of Guarantee before the tenancy commences</li>
<li>Agree to cover any rent arrears or damages caused by the Tenant</li>
</ul>
<!-- ENDIF -->`
  },
  {
    id: 'deposit-high-conditional',
    title: 'If Deposit > 5 Weeks Rent',
    condition: '{{deposit_amount}} > 5 weeks rent',
    description: 'Show additional deposit protection terms',
    html: `<!-- IF {{deposit_amount}} > 5 weeks rent -->
<h3>Enhanced Deposit Protection</h3>
<p>As the deposit exceeds five weeks' rent, additional protections apply:</p>
<ul>
<li>The deposit is protected in an insured scheme</li>
<li>The Tenant will receive prescribed information within 30 days</li>
<li>The Tenant has the right to request deposit repayment at the end of the tenancy</li>
</ul>
<!-- ENDIF -->`
  },
  {
    id: 'hmo-conditional',
    title: 'If HMO Property',
    condition: '{{is_hmo}} = Yes',
    description: 'Show HMO-specific clauses',
    html: `<!-- IF {{is_hmo}} = "Yes" -->
<h3>HMO-Specific Terms</h3>
<p>As this is a House in Multiple Occupation (HMO), the following additional terms apply:</p>
<ul>
<li>Common areas must be kept clean and tidy</li>
<li>Noise must be kept to a reasonable level, especially between 11pm and 7am</li>
<li>Waste must be disposed of in designated bins</li>
<li>Fire doors must not be obstructed</li>
<li>The Tenant must comply with the HMO management regulations</li>
</ul>
<!-- ENDIF -->`
  },
]

export default function ConditionalBlocksPanel({ onInsertBlock }: ConditionalBlocksPanelProps) {
  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Conditional Blocks</h3>
        </div>
        <p className="text-xs text-gray-500">
          Insert blocks that only appear when conditions are met
        </p>
      </div>

      {/* Blocks list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {CONDITIONAL_BLOCKS.map(block => (
            <div
              key={block.id}
              className="group p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-400 rounded-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-medium text-gray-900 flex-1">
                  {block.title}
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onInsertBlock(block.html)}
                  title="Insert conditional block"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs bg-white">
                  {block.condition}
                </Badge>
              </div>
              
              <p className="text-xs text-gray-500">
                {block.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
          <p className="text-xs text-blue-800">
            <strong>How it works:</strong> Conditional blocks use <code className="bg-blue-100 px-1 rounded">{'<!-- IF -->'}</code> syntax. The agreement generator evaluates conditions and includes/excludes content automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
