import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Search, Plus } from 'lucide-react'

interface ClauseLibraryPanelProps {
  onInsertClause: (clauseHtml: string) => void
}

// Pre-built legal clauses for UK AST agreements
const CLAUSE_CATEGORIES = [
  {
    id: 'tenant-obligations',
    name: 'Tenant Obligations',
    clauses: [
      {
        id: 'rent-payment',
        title: 'Rent Payment Terms',
        description: 'Standard rent payment obligations',
        html: `<h3>Rent Payment</h3>
<p>The Tenant shall pay the rent of <strong>{{rent_amount}}</strong> per calendar month, payable in advance on the {{rent_due_day}} day of each month.</p>
<p>The first payment shall be made on or before {{start_date}} and subsequent payments shall continue throughout the tenancy.</p>
<p>Rent shall be paid by standing order or direct debit to the Landlord's nominated bank account.</p>`
      },
      {
        id: 'utilities',
        title: 'Utilities & Services',
        description: 'Tenant responsibility for utilities',
        html: `<h3>Utilities and Services</h3>
<p>The Tenant shall be responsible for the payment of all charges for electricity, gas, water, sewerage, broadband, and telecommunications services used at the Property during the tenancy.</p>
<p>The Tenant shall ensure that all utility accounts are transferred into their name promptly upon commencement of the tenancy.</p>`
      },
      {
        id: 'council-tax',
        title: 'Council Tax',
        description: 'Council tax responsibility',
        html: `<h3>Council Tax</h3>
<p>The Tenant shall be responsible for the payment of Council Tax charged on the Property during the tenancy and shall ensure that the Property is registered with the local authority for Council Tax purposes.</p>`
      },
      {
        id: 'property-care',
        title: 'Property Care & Maintenance',
        description: 'Tenant obligations for property upkeep',
        html: `<h3>Property Care and Maintenance</h3>
<p>The Tenant shall:</p>
<ul>
<li>Keep the Property in a clean and tenantable condition</li>
<li>Take proper care of the Property and its contents</li>
<li>Carry out minor maintenance tasks such as replacing light bulbs and batteries in smoke detectors</li>
<li>Ensure adequate ventilation and heating to prevent condensation and mould growth</li>
<li>Not make any alterations or additions to the Property without the Landlord's prior written consent</li>
<li>Notify the Landlord promptly of any damage or need for repairs</li>
</ul>`
      },
      {
        id: 'no-subletting',
        title: 'No Subletting or Assignment',
        description: 'Prohibition on subletting',
        html: `<h3>Subletting and Assignment</h3>
<p>The Tenant shall not assign, sublet, or part with possession of the Property or any part of it, or take in lodgers, without the prior written consent of the Landlord, which shall not be unreasonably withheld.</p>`
      },
      {
        id: 'pets',
        title: 'Pets Clause (Standard)',
        description: 'No pets without permission',
        html: `<h3>Pets</h3>
<p>The Tenant shall not keep any pets or other animals in the Property without the prior written consent of the Landlord. Such consent, if given, may be withdrawn by the Landlord giving one month's notice in writing if in the Landlord's reasonable opinion the pet is causing nuisance or damage.</p>`
      },
      {
        id: 'pets-allowed',
        title: 'Pets Clause (With Permission)',
        description: 'Pets allowed with conditions',
        html: `<h3>Pets</h3>
<p>The Landlord grants permission for the Tenant to keep the following pet(s) at the Property: <strong>{{pet_details}}</strong>.</p>
<p>The Tenant agrees to:</p>
<ul>
<li>Ensure the pet(s) do not cause nuisance or disturbance to neighbours</li>
<li>Keep the Property free from damage caused by the pet(s)</li>
<li>Have the Property professionally cleaned at the end of the tenancy if required</li>
<li>Not allow additional pets without the Landlord's further written consent</li>
</ul>`
      },
      {
        id: 'smoking',
        title: 'No Smoking Clause',
        description: 'Smoking prohibition',
        html: `<h3>Smoking</h3>
<p>The Tenant shall not smoke cigarettes, cigars, or any other substance, nor permit any other person to smoke, within the Property. This restriction is imposed to protect the Property from fire damage and to prevent odours and staining.</p>`
      },
    ]
  },
  {
    id: 'landlord-obligations',
    name: 'Landlord Obligations',
    clauses: [
      {
        id: 'quiet-enjoyment',
        title: 'Quiet Enjoyment',
        description: 'Tenant\'s right to peaceful occupation',
        html: `<h3>Quiet Enjoyment</h3>
<p>The Landlord covenants with the Tenant that the Tenant, paying the rent and observing the Tenant's obligations, shall peaceably hold and enjoy the Property during the tenancy without any interruption by the Landlord or any person claiming under the Landlord.</p>`
      },
      {
        id: 'repairs',
        title: 'Landlord Repair Obligations',
        description: 'Statutory repair obligations',
        html: `<h3>Landlord's Repair Obligations</h3>
<p>The Landlord shall:</p>
<ul>
<li>Keep in repair the structure and exterior of the Property (including drains, gutters, and external pipes)</li>
<li>Keep in repair and proper working order the installations for the supply of water, gas, electricity, and for sanitation</li>
<li>Keep in repair and proper working order the installations for space heating and water heating</li>
<li>Comply with all statutory obligations and requirements applicable to the Property</li>
</ul>
<p>The Landlord shall carry out any repairs for which the Landlord is responsible within a reasonable time after receiving notice from the Tenant.</p>`
      },
      {
        id: 'insurance',
        title: 'Property Insurance',
        description: 'Landlord insurance obligations',
        html: `<h3>Insurance</h3>
<p>The Landlord shall insure the Property against loss or damage by fire, flood, storm, and other usual risks and shall use any insurance proceeds to reinstate the Property.</p>`
      },
    ]
  },
  {
    id: 'termination',
    name: 'Termination & Notice',
    clauses: [
      {
        id: 'tenant-notice',
        title: 'Tenant Notice Period',
        description: 'How tenant can end tenancy',
        html: `<h3>Termination by Tenant</h3>
<p>The Tenant may terminate this tenancy by giving not less than one month's notice in writing to the Landlord, such notice to expire on the last day of a period of the tenancy.</p>`
      },
      {
        id: 'section-21',
        title: 'Section 21 Notice',
        description: 'Landlord\'s no-fault eviction notice',
        html: `<h3>Section 21 Notice</h3>
<p>The Landlord may seek possession of the Property under Section 21 of the Housing Act 1988 by giving not less than two months' notice in writing to the Tenant. The notice shall not expire before the end of the initial fixed term (if any).</p>
<p><strong>Note:</strong> The Landlord must have complied with all legal obligations including protecting the deposit and providing prescribed information before a Section 21 notice can be served.</p>`
      },
      {
        id: 'section-8',
        title: 'Section 8 Notice (Rent Arrears)',
        description: 'Eviction for rent arrears',
        html: `<h3>Section 8 Notice - Rent Arrears</h3>
<p>If the rent is unpaid for 14 days (whether formally demanded or not), the Landlord may seek possession under Section 8 of the Housing Act 1988 (Ground 8), provided that at the date of service of notice and at the date of the hearing, rent is at least 2 months in arrears.</p>`
      },
      {
        id: 'abandonment',
        title: 'Abandonment Clause',
        description: 'What happens if property is abandoned',
        html: `<h3>Abandonment</h3>
<p>If the Tenant abandons the Property (i.e., is absent for a continuous period of 14 days or more whilst rent is outstanding), the Landlord may serve an abandonment notice. If the Tenant does not respond within 14 days, the tenancy may be terminated.</p>`
      },
    ]
  },
  {
    id: 'deposit',
    name: 'Deposit & Payments',
    clauses: [
      {
        id: 'deposit-protection',
        title: 'Deposit Protection',
        description: 'TDP scheme obligations',
        html: `<h3>Tenancy Deposit Protection</h3>
<p>The Landlord shall protect the Tenant's deposit of <strong>{{deposit_amount}}</strong> in a government-authorised Tenancy Deposit Protection (TDP) scheme within 30 days of receipt.</p>
<p>The Landlord shall provide the Tenant with the prescribed information relating to the deposit as required by the Housing Act 2004.</p>
<p>The deposit will be protected with: <strong>{{deposit_scheme}}</strong></p>`
      },
      {
        id: 'deposit-deductions',
        title: 'Deposit Deductions',
        description: 'When deposit can be withheld',
        html: `<h3>Deposit Deductions</h3>
<p>At the end of the tenancy, the deposit (less any lawful deductions) shall be returned to the Tenant. Lawful deductions may be made for:</p>
<ul>
<li>Rent arrears</li>
<li>Damage beyond fair wear and tear</li>
<li>Missing or damaged items listed in the inventory</li>
<li>Professional cleaning if the Property is not returned in the same condition as at the start</li>
<li>Unpaid utility bills or council tax</li>
</ul>`
      },
    ]
  },
  {
    id: 'general',
    name: 'General Clauses',
    clauses: [
      {
        id: 'right-to-enter',
        title: 'Landlord\'s Right of Entry',
        description: 'When landlord can access property',
        html: `<h3>Landlord's Right of Entry</h3>
<p>The Landlord or the Landlord's agents may enter the Property at reasonable times and upon giving at least 24 hours' notice in writing to the Tenant for the purpose of:</p>
<ul>
<li>Inspecting the condition of the Property</li>
<li>Carrying out repairs or maintenance</li>
<li>Showing the Property to prospective tenants or purchasers (in the last 2 months of the tenancy)</li>
</ul>
<p>In cases of emergency, the Landlord may enter without notice.</p>`
      },
      {
        id: 'furnished-inventory',
        title: 'Furnished Property & Inventory',
        description: 'Inventory and contents clause',
        html: `<h3>Furnished Property and Inventory</h3>
<p>An Inventory and Schedule of Condition has been prepared and signed by both parties at the commencement of this tenancy. The Tenant acknowledges receipt of a copy.</p>
<p>The Tenant shall return all items listed in the Inventory at the end of the tenancy in the same condition as at the start, fair wear and tear excepted.</p>`
      },
      {
        id: 'data-protection',
        title: 'Data Protection (GDPR)',
        description: 'Privacy and data handling',
        html: `<h3>Data Protection</h3>
<p>The Landlord and Agent will process the Tenant's personal data in accordance with applicable data protection legislation. Personal data will be used solely for the purposes of managing this tenancy and will not be disclosed to third parties except where required by law.</p>`
      },
      {
        id: 'entire-agreement',
        title: 'Entire Agreement Clause',
        description: 'Complete agreement statement',
        html: `<h3>Entire Agreement</h3>
<p>This Agreement constitutes the entire agreement between the parties with respect to the tenancy of the Property and supersedes all prior agreements, representations, and understandings.</p>
<p>No variation or addition to this Agreement shall be binding unless it is in writing and signed by or on behalf of both parties.</p>`
      },
    ]
  },
]

export default function ClauseLibraryPanel({ onInsertClause }: ClauseLibraryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['tenant-obligations']))

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const filteredCategories = CLAUSE_CATEGORIES.map(cat => ({
    ...cat,
    clauses: cat.clauses.filter(clause =>
      clause.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.clauses.length > 0)

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Clause Library</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search clauses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Clause list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No clauses found
            </div>
          ) : (
            filteredCategories.map(category => (
              <div key={category.id} className="space-y-1">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <span>{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.clauses.length}
                  </Badge>
                </button>

                {/* Clauses */}
                {expandedCategories.has(category.id) && (
                  <div className="ml-2 space-y-1">
                    {category.clauses.map(clause => (
                      <div
                        key={clause.id}
                        className="group p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 flex-1">
                            {clause.title}
                          </h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onInsertClause(clause.html)}
                            title="Insert clause"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {clause.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Click + to insert clause at cursor position
        </p>
      </div>
    </div>
  )
}
