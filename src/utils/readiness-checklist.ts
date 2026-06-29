/**
 * Default readiness checklists
 */

import type { ReadinessItem } from './inventory'

/**
 * Default pre-tenancy checklist
 */
export function getDefaultPreTenancyChecklist(): ReadinessItem[] {
  return [
    { task: 'EPC certificate valid', completed: false },
    { task: 'Gas Safety certificate valid', completed: false },
    { task: 'EICR certificate valid', completed: false },
    { task: 'Smoke alarms tested', completed: false },
    { task: 'Carbon monoxide detectors tested', completed: false },
    { task: 'Property professionally cleaned', completed: false },
    { task: 'All repairs completed', completed: false },
    { task: 'Inventory completed and documented', completed: false },
    { task: 'Keys prepared and counted', completed: false },
    { task: 'Utilities set up or transferred', completed: false },
  ]
}

/**
 * Default check-in checklist
 */
export function getDefaultCheckInChecklist(): ReadinessItem[] {
  return [
    { task: 'Tenant greeted and welcomed', completed: false },
    { task: 'Property walkthrough completed', completed: false },
    { task: 'Inventory reviewed and agreed', completed: false },
    { task: 'Keys handed over and logged', completed: false },
    { task: 'Meter readings taken and recorded', completed: false },
    { task: 'Emergency contacts provided', completed: false },
    { task: 'Tenant signature captured', completed: false },
    { task: 'Agent signature captured', completed: false },
  ]
}

/**
 * Default check-out checklist
 */
export function getDefaultCheckOutChecklist(): ReadinessItem[] {
  return [
    { task: 'Tenant notified of check-out process', completed: false },
    { task: 'Final walkthrough completed', completed: false },
    { task: 'Inventory checked against check-in report', completed: false },
    { task: 'Damage or missing items documented', completed: false },
    { task: 'Keys returned and logged', completed: false },
    { task: 'Final meter readings taken', completed: false },
    { task: 'Deposit deduction notes prepared', completed: false },
    { task: 'Tenant signature captured', completed: false },
    { task: 'Agent signature captured', completed: false },
  ]
}
