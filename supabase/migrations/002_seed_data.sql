-- ============================================================
-- LettingsPro — Seed Data
-- Roles, permissions, agreement clauses, default templates
-- ============================================================

-- ============================================================
-- SECTION 1: PERMISSIONS MATRIX
-- ============================================================

-- Ensure a permission row exists for every role/resource combination
INSERT INTO permissions (role_id, resource, can_read, can_write, can_delete)
SELECT r.id, res.resource, false, false, false
FROM roles r
CROSS JOIN (
  VALUES
    ('properties'),('landlords'),('tenants'),('tenancies'),('maintenance'),
    ('finance'),('documents'),('agreements'),('settings')
) AS res(resource)
ON CONFLICT (role_id, resource) DO NOTHING;

-- Admin: full access
UPDATE permissions p SET can_read = true, can_write = true, can_delete = true
FROM roles r WHERE p.role_id = r.id AND r.name = 'admin';

-- Manager: read/write on operational, read-only settings
UPDATE permissions p SET can_read = true, can_write = true, can_delete = false
FROM roles r WHERE p.role_id = r.id AND r.name = 'manager'
  AND p.resource IN ('properties','landlords','tenants','tenancies','maintenance','finance','documents','agreements');
UPDATE permissions p SET can_read = true, can_write = false, can_delete = false
FROM roles r WHERE p.role_id = r.id AND r.name = 'manager' AND p.resource = 'settings';

-- Negotiator: read/write on core modules
UPDATE permissions p SET can_read = true, can_write = true, can_delete = false
FROM roles r WHERE p.role_id = r.id AND r.name = 'negotiator'
  AND p.resource IN ('properties','landlords','tenants','tenancies','agreements','documents');
UPDATE permissions p SET can_read = true, can_write = false, can_delete = false
FROM roles r WHERE p.role_id = r.id AND r.name = 'negotiator'
  AND p.resource IN ('maintenance','finance','settings');

-- Accounts: finance and documents read/write
UPDATE permissions p SET can_read = true, can_write = true, can_delete = false
FROM roles r WHERE p.role_id = r.id AND r.name = 'accounts'
  AND p.resource IN ('finance','documents');
UPDATE permissions p SET can_read = true, can_write = false, can_delete = false
FROM roles r WHERE p.role_id = r.id AND r.name = 'accounts'
  AND p.resource IN ('properties','landlords','tenants','tenancies','maintenance','agreements','settings');

-- ============================================================
-- SECTION 2: AGREEMENT CLAUSES LIBRARY
-- ============================================================

INSERT INTO agreement_clauses (category, title, content_html, sort_order, is_builtin) VALUES

-- TERMS & CONDITIONS (1–7)
('terms_conditions', 'Definitions & Interpretation',
'<h3>1. Definitions and Interpretation</h3>
<p><strong>1.1</strong> In this Agreement, unless the context otherwise requires, the following expressions have the following meanings:</p>
<p><strong>"The Landlord"</strong> means {{landlord_name}}, the owner of the Property or their authorised agent.</p>
<p><strong>"The Tenant"</strong> means {{tenant_name}}.</p>
<p><strong>"The Property"</strong> means {{property_address}} including all fixtures, fittings, and fittings as listed in the Inventory.</p>
<p><strong>"The Term"</strong> means the period from {{start_date}} to {{end_date}}.</p>
<p><strong>"The Rent"</strong> means {{rent_amount}} per calendar month, payable in advance.</p>
<p><strong>"The Deposit"</strong> means {{deposit_amount}}, held in accordance with the Deposit clause of this Agreement.</p>
<p><strong>1.2</strong> Words importing the singular shall include the plural and vice versa. Headings are for convenience only and shall not affect interpretation.</p>',
1, true),

('terms_conditions', 'Grant of Tenancy',
'<h3>2. Grant of Tenancy</h3>
<p><strong>2.1</strong> The Landlord lets and the Tenant takes the Property for the Term at the Rent, payable as set out in this Agreement.</p>
<p><strong>2.2</strong> This Tenancy is an Assured Periodic Tenancy under the Housing Act 1988 (as amended by the Housing Act 1996).</p>
<p><strong>2.3</strong> The Tenant''s right to occupy the Property begins on {{start_date}} and, subject to earlier termination in accordance with this Agreement or by law, ends on {{end_date}}.</p>
<p><strong>2.4</strong> The Tenant acknowledges that they have inspected the Property and accept it in its current condition, subject to any matters noted in the Inventory and Schedule of Condition.</p>',
2, true),

('terms_conditions', 'Rent Payment Terms',
'<h3>3. Rent</h3>
<p><strong>3.1</strong> The Rent is {{rent_amount}} per calendar month, payable in advance on the [day] day of each month.</p>
<p><strong>3.2</strong> The first payment of Rent shall be made on or before {{start_date}} and shall be apportioned if the Tenancy begins on a day other than the first of the month.</p>
<p><strong>3.3</strong> Rent shall be paid by standing order or direct debit to the Landlord''s nominated bank account.</p>
<p><strong>3.4</strong> If the Rent or any part of it remains unpaid for 14 days after it becomes due, the Tenant shall pay interest on the overdue amount at the rate of 3% per annum above the Bank of England base rate.</p>
<p><strong>3.5</strong> The Landlord reserves the right to review the Rent annually upon giving the Tenant not less than one month''s written notice.</p>',
3, true),

('terms_conditions', 'Deposit Protection',
'<h3>4. Deposit</h3>
<p><strong>4.1</strong> The Tenant shall pay a Deposit of {{deposit_amount}} to the Landlord on or before {{start_date}}.</p>
<p><strong>4.2</strong> The Deposit shall be protected in a government-authorised tenancy deposit protection scheme within 30 days of receipt. The scheme used is: {{deposit_scheme}}.</p>
<p><strong>4.3</strong> The Landlord shall provide the Tenant with the prescribed information regarding the deposit protection within 30 days of receipt of the Deposit.</p>
<p><strong>4.4</strong> The Deposit is held as security against: (a) Any damage to the Property or its contents (fair wear and tear excepted); (b) Any unpaid Rent or other sums due under this Agreement; (c) Any breach of the Tenant''s obligations.</p>
<p><strong>4.5</strong> At the end of the Tenancy, the Deposit shall be returned to the Tenant within 10 working days of agreement between the parties, less any lawful deductions.</p>',
4, true),

('terms_conditions', 'Tenant Obligations',
'<h3>5. Tenant''s Obligations</h3>
<p>The Tenant agrees with the Landlord as follows:</p>
<p><strong>5.1</strong> To pay the Rent and all other sums due under this Agreement promptly when due.</p>
<p><strong>5.2</strong> To pay all charges for electricity, gas, water, sewerage, council tax, telephone, broadband, television licence and any other utility consumed at the Property during the Tenancy.</p>
<p><strong>5.3</strong> To keep the interior of the Property and all fixtures, fittings and effects in good and clean condition (fair wear and tear excepted).</p>
<p><strong>5.4</strong> To keep the Property adequately heated and ventilated to prevent condensation and mould growth.</p>
<p><strong>5.5</strong> Not to make any alteration or addition to the Property, including decorating, without the Landlord''s prior written consent.</p>
<p><strong>5.6</strong> To report any repairs, defects or maintenance issues to the Landlord promptly.</p>
<p><strong>5.7</strong> To allow the Landlord or their agent access to the Property at reasonable times (with at least 24 hours'' written notice, except in emergency).</p>
<p><strong>5.8</strong> Not to assign, sublet, or part with possession of the whole or any part of the Property without the Landlord''s prior written consent.</p>
<p><strong>5.9</strong> Not to use the Property for any purpose other than as a private residence.</p>
<p><strong>5.10</strong> Not to cause nuisance, annoyance, or disturbance to neighbours.</p>',
5, true),

('terms_conditions', 'Landlord Obligations',
'<h3>6. Landlord''s Obligations</h3>
<p>The Landlord agrees with the Tenant as follows:</p>
<p><strong>6.1</strong> To ensure that the Tenant may quietly possess and enjoy the Property during the Tenancy.</p>
<p><strong>6.2</strong> To keep in repair the structure and exterior of the Property (including drains, gutters and external pipes).</p>
<p><strong>6.3</strong> To keep in repair and proper working order the installations for the supply of water, gas, electricity, sanitation, space heating and water heating.</p>
<p><strong>6.4</strong> To maintain all gas appliances and flues to current Gas Safety Regulations and provide the Tenant with an annual Gas Safety Certificate.</p>
<p><strong>6.5</strong> To ensure all electrical equipment supplied is safe and maintained in accordance with Electrical Safety Regulations.</p>
<p><strong>6.6</strong> To ensure the Property has working smoke alarms on each floor and carbon monoxide detectors in any room with a solid fuel burning appliance.</p>
<p><strong>6.7</strong> To hold adequate buildings insurance for the Property.</p>',
6, true),

('terms_conditions', 'Termination & Notice',
'<h3>7. Termination</h3>
<p><strong>7.1</strong> This Agreement may be terminated before the end of the Term in the following circumstances:
(a) By mutual agreement between the Landlord and Tenant in writing;
(b) By the Landlord serving notice under Section 8 or Section 21 of the Housing Act 1988;
(c) By the Tenant serving not less than one month''s written notice to expire on a rent day.</p>
<p><strong>7.2</strong> Upon termination, the Tenant shall: (a) Remove all personal belongings and rubbish; (b) Leave the Property clean and in the same condition as at commencement; (c) Return all keys, fobs and access devices; (d) Provide a forwarding address.</p>
<p><strong>7.3</strong> If the Tenant remains in occupation after the end of the Term without the Landlord''s consent, the Tenant shall be liable to pay double rent.</p>',
7, true),

-- TENANCY REQUIREMENTS (11–16)
('tenancy_requirements', 'Pet Policy',
'<h3>Pets Policy</h3>
<p><strong>1.</strong> The Tenant shall not keep any pets or animals at the Property without the Landlord''s prior written consent (such consent not to be unreasonably withheld).</p>
<p><strong>2.</strong> If consent is given for a pet, the Tenant agrees to: (a) Ensure the pet does not cause nuisance, damage, or disturbance; (b) Keep the Property free from fleas, odours and pet-related damage; (c) Arrange professional cleaning of all carpets and soft furnishings at the Tenant''s expense at the end of the Tenancy; (d) Make good any damage caused by the pet.</p>
<p><strong>3.</strong> The Landlord may require an additional pet deposit as security against potential pet-related damage.</p>',
11, true),

('tenancy_requirements', 'Smoking Policy',
'<h3>Smoking Policy</h3>
<p><strong>1.</strong> Smoking (including e-cigarettes and vaping) is strictly prohibited anywhere inside the Property.</p>
<p><strong>2.</strong> Smoking is permitted only in designated outdoor areas, and all cigarette ends and debris must be disposed of safely.</p>
<p><strong>3.</strong> Any breach of this policy shall constitute a material breach of this Tenancy Agreement. The Tenant shall be liable for the cost of deep cleaning, repainting, and replacement of any damaged furnishings.</p>',
12, true),

('tenancy_requirements', 'Subletting & Assignment',
'<h3>Subletting and Assignment</h3>
<p><strong>1.</strong> The Tenant shall not assign this Tenancy, sublet the whole or any part of the Property, or take in lodgers without the Landlord''s prior written consent.</p>
<p><strong>2.</strong> The Landlord shall not unreasonably withhold consent but may impose reasonable conditions.</p>
<p><strong>3.</strong> Any unauthorised subletting shall constitute a material breach of this Agreement and may result in possession proceedings.</p>
<p><strong>4.</strong> The Tenant remains liable for all obligations under this Agreement even where the Landlord has consented to subletting.</p>',
13, true),

('tenancy_requirements', 'Occupation & Use',
'<h3>Occupation and Use of Property</h3>
<p><strong>1.</strong> The Property shall be used solely as a private dwelling for the Tenant and permitted occupiers.</p>
<p><strong>2.</strong> The Tenant shall not use the Property for any trade, business, profession or commercial activity without the Landlord''s prior written consent.</p>
<p><strong>3.</strong> The Tenant shall not register a company or business at the Property address without consent.</p>
<p><strong>4.</strong> The Tenant shall not hold any auction, sale, or public event at the Property.</p>',
14, true),

('tenancy_requirements', 'Gardens & External Areas',
'<h3>Gardens and External Areas</h3>
<p><strong>1.</strong> The Tenant shall keep any garden, yard, patio or external areas in a reasonably tidy and weed-free condition.</p>
<p><strong>2.</strong> The Tenant shall regularly mow lawns during the growing season and trim hedges as necessary.</p>
<p><strong>3.</strong> The Tenant shall not remove, damage, or destroy any established trees, shrubs, or plants without consent.</p>
<p><strong>4.</strong> The Tenant shall not erect any shed, greenhouse, or permanent structure without consent.</p>
<p><strong>5.</strong> The Tenant shall not store hazardous, flammable, or illegal materials anywhere on the Property.</p>',
15, true),

('tenancy_requirements', 'Refuse & Recycling',
'<h3>Refuse and Recycling</h3>
<p><strong>1.</strong> The Tenant shall dispose of all household waste properly and in accordance with the local authority''s collection and recycling requirements.</p>
<p><strong>2.</strong> Bins and recycling containers shall be placed at the designated collection point no earlier than the evening before the scheduled collection day and returned promptly after collection.</p>
<p><strong>3.</strong> The Tenant shall not allow refuse to accumulate at the Property in a manner that causes nuisance.</p>
<p><strong>4.</strong> At the end of the Tenancy, the Tenant shall remove all waste and shall not leave any items behind unless agreed in writing.</p>',
16, true),

-- DEPOSIT & FINANCIAL (21–23)
('deposit_financial', 'Rent Arrears & Late Payment',
'<h3>Rent Arrears and Late Payment</h3>
<p><strong>1.</strong> If the Tenant falls into rent arrears, the Landlord shall contact the Tenant in writing within 7 days of the missed payment to discuss the situation.</p>
<p><strong>2.</strong> If arrears exceed 14 days, the Landlord may serve formal notice under Section 8 of the Housing Act 1988.</p>
<p><strong>3.</strong> The Landlord may charge the Tenant reasonable costs incurred in recovering unpaid Rent.</p>
<p><strong>4.</strong> The Landlord may report rent arrears to credit reference agencies.</p>',
21, true),

('deposit_financial', 'Deposit Deductions & Disputes',
'<h3>Deposit Deductions and Disputes</h3>
<p><strong>1.</strong> At the end of the Tenancy, the Landlord shall conduct a check-out inspection and provide the Tenant with a written schedule of any proposed deductions within 10 working days.</p>
<p><strong>2.</strong> Deductions may be claimed for: (a) Unpaid Rent; (b) Damage beyond fair wear and tear; (c) Cleaning costs; (d) Missing items; (e) Unpaid utility bills.</p>
<p><strong>3.</strong> The Landlord shall provide evidence to support any deduction claimed.</p>
<p><strong>4.</strong> Any dispute shall be resolved through the deposit protection scheme''s Alternative Dispute Resolution (ADR) service.</p>',
22, true),

('deposit_financial', 'Rent Review Clause',
'<h3>Rent Review</h3>
<p><strong>1.</strong> The Landlord may review the Rent annually, with the first review taking effect not less than 12 months after commencement.</p>
<p><strong>2.</strong> The Landlord shall give not less than one month''s written notice of any proposed increase.</p>
<p><strong>3.</strong> Any proposed increase shall be reasonable and not exceed the market rent for comparable properties.</p>
<p><strong>4.</strong> If the Tenant disagrees, the parties shall negotiate in good faith. If agreement cannot be reached, either party may refer the matter to an independent valuer.</p>',
23, true),

-- SPECIAL CLAUSES (31–35)
('special_clauses', 'Break Clause',
'<h3>Break Clause</h3>
<p><strong>1.</strong> Either party may terminate this Tenancy by giving not less than two months'' written notice, such notice to expire no earlier than 6 months after commencement.</p>
<p><strong>2.</strong> Any notice must: (a) Be in writing and signed; (b) Specify the termination date; (c) Be served in accordance with the notice provisions.</p>
<p><strong>3.</strong> This clause does not prejudice either party''s right to terminate on other grounds.</p>
<p><strong>4.</strong> If the Tenant exercises the break clause, all Rent and other sums due up to the termination date must be paid in full.</p>',
31, true),

('special_clauses', 'Guarantor Agreement',
'<h3>Guarantor Clause</h3>
<p><strong>1.</strong> In consideration of the Landlord entering into this Tenancy Agreement, the Guarantor: (a) Guarantees that the Tenant shall perform all obligations; (b) Agrees to pay all losses arising from any breach; (c) Agrees that liability shall not be affected by any time or indulgence given to the Tenant.</p>
<p><strong>2.</strong> The Guarantor''s liability shall continue for the duration of the Tenancy including any statutory periodic tenancy.</p>
<p><strong>3.</strong> The Guarantor shall not be released from liability except by written agreement signed by the Landlord.</p>',
32, true),

('special_clauses', 'Furnishings & Inventory',
'<h3>Furnishings and Inventory</h3>
<p><strong>1.</strong> The Property is let as detailed in the Inventory and Schedule of Condition, a copy of which has been provided to the Tenant and signed by both parties.</p>
<p><strong>2.</strong> The Tenant shall: (a) Not remove any of the Landlord''s furniture; (b) Keep all furniture in good condition; (c) Not bring additional large furniture without consent.</p>
<p><strong>3.</strong> All items listed in the Inventory shall be checked at the end of the Tenancy. Any missing or damaged items shall be charged to the Tenant.</p>
<p><strong>4.</strong> The Tenant shall ensure all upholstered furniture complies with the Furniture and Furnishings (Fire) (Safety) Regulations 1988.</p>',
33, true),

('special_clauses', 'Joint & Several Liability',
'<h3>Joint and Several Liability</h3>
<p><strong>1.</strong> Where the Tenant comprises two or more persons, their obligations under this Agreement shall be joint and several.</p>
<p><strong>2.</strong> Each individual Tenant is fully responsible for all obligations, including the payment of the full Rent.</p>
<p><strong>3.</strong> A Tenant who pays more than their share shall be entitled to claim contribution from the other Tenants.</p>
<p><strong>4.</strong> Any notice served by the Landlord on one Tenant shall be deemed to have been served on all Tenants.</p>',
34, true),

('special_clauses', 'Data Protection & Privacy',
'<h3>Data Protection and Privacy</h3>
<p><strong>1.</strong> The Landlord and {{agency_name}} shall process the Tenant''s personal data in accordance with the UK GDPR and the Data Protection Act 2018.</p>
<p><strong>2.</strong> Personal data shall be used solely for purposes relating to this Tenancy, including: (a) Referencing and credit checks; (b) Deposit protection; (c) Rent collection; (d) Property management; (e) Compliance with legal obligations.</p>
<p><strong>3.</strong> The Landlord shall not share the Tenant''s personal data with third parties except as required by law.</p>
<p><strong>4.</strong> The Tenant has the right to access, correct, and request deletion of their personal data.</p>',
35, true)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SECTION 3: DEFAULT AST AGREEMENT BODY
-- ============================================================

INSERT INTO agreement_defaults (key, name, body_html)
VALUES (
  'default_ast',
  'Assured Periodic Tenancy Agreement',
  '<h2>1. Parties</h2>
<p>This Agreement is made on <strong>{{today_date}}</strong> between:</p>
<p><strong>The Landlord:</strong> {{landlord_name}} of {{landlord_address}}</p>
<p><strong>The Tenant(s):</strong> {{tenant_name}}</p>
<p><strong>The Agent:</strong> {{agency_name}} of {{agency_address}}, acting on behalf of the Landlord.</p>

<h2>2. The Property</h2>
<p>The Landlord agrees to let and the Tenant agrees to take the property known as <strong>{{property_address}}, {{property_postcode}}</strong> ("the Property"), together with any fixtures, fittings, and furniture.</p>

<h2>3. Term</h2>
<p>The tenancy shall be for a fixed term commencing on <strong>{{start_date}}</strong> and ending on <strong>{{end_date}}</strong> ("the Term").</p>

<h2>4. Rent</h2>
<p>The Tenant agrees to pay rent of <strong>{{rent_amount}}</strong> per calendar month, payable in advance on or before the rent due date each month.</p>

<h2>5. Deposit</h2>
<p>The Tenant agrees to pay a deposit of <strong>{{deposit_amount}}</strong>. The deposit will be protected in a government-authorised tenancy deposit protection scheme within 30 days of receipt.</p>

<h2>6. Tenant Obligations</h2>
<ul>
<li>To pay the rent on time and in full.</li>
<li>To use the Property as a private residence only.</li>
<li>To keep the Property clean and in good condition.</li>
<li>To report any damage or required repairs to the Agent promptly.</li>
<li>Not to sublet or assign the tenancy without written consent.</li>
</ul>

<h2>7. Landlord / Agent Obligations</h2>
<ul>
<li>To keep the structure and exterior of the Property in repair.</li>
<li>To maintain gas, electrical, and other safety installations.</li>
<li>To provide valid compliance certificates as listed in Appendix A.</li>
<li>To protect the deposit in accordance with the Housing Act 2004.</li>
</ul>

<h2>8. Notice</h2>
<p>The Tenant agrees to give at least two months'' written notice to end the tenancy in accordance with the terms of this Agreement and statutory requirements.</p>

<h2>9. Governing Law</h2>
<p>This Agreement is governed by the laws of England and Wales.</p>'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SECTION 4: STRUCTURED TEMPLATE SEED
-- ============================================================

DO $$
DECLARE
  default_template_id UUID;
  section_parties UUID;
  section_property UUID;
  section_financial UUID;
  section_tenant_oblig UUID;
  section_landlord_oblig UUID;
  section_requirements UUID;
  section_special UUID;
  section_signatures UUID;
  clause_rent UUID;
  clause_deposit UUID;
  clause_tenant_oblig UUID;
  clause_landlord_oblig UUID;
  clause_smoking UUID;
  clause_subletting UUID;
  clause_occupation UUID;
  clause_gardens UUID;
  clause_refuse UUID;
  clause_break UUID;
  clause_guarantor UUID;
  clause_furnishings UUID;
  clause_joint_liability UUID;
  clause_data_protection UUID;
BEGIN
  -- Find or create default template
  SELECT id INTO default_template_id FROM agreement_templates WHERE is_default = true LIMIT 1;
  IF default_template_id IS NULL THEN
    INSERT INTO agreement_templates (name, content_json, is_default)
    VALUES ('Standard AST', '{}', true)
    RETURNING id INTO default_template_id;
  END IF;

  -- Create version 1
  INSERT INTO template_versions (template_id, version_number, change_summary, content_snapshot)
  VALUES (default_template_id, 1, 'Initial structured template', '{}');

  -- Section: Parties
  INSERT INTO template_sections (template_id, section_type, title, sort_order, is_required)
  VALUES (default_template_id, 'parties', 'Parties to the Agreement', 1, true)
  RETURNING id INTO section_parties;

  -- Section: Property Details
  INSERT INTO template_sections (template_id, section_type, title, sort_order, is_required)
  VALUES (default_template_id, 'property_details', 'Property Details', 2, true)
  RETURNING id INTO section_property;

  -- Section: Financial Terms
  INSERT INTO template_sections (template_id, section_type, title, sort_order, is_required)
  VALUES (default_template_id, 'financial_terms', 'Financial Terms', 3, true)
  RETURNING id INTO section_financial;

  SELECT id INTO clause_rent FROM agreement_clauses WHERE category = 'terms_conditions' AND title = 'Rent Payment Terms' LIMIT 1;
  SELECT id INTO clause_deposit FROM agreement_clauses WHERE category = 'terms_conditions' AND title = 'Deposit Protection' LIMIT 1;
  IF clause_rent IS NOT NULL THEN
    INSERT INTO template_section_clauses (section_id, clause_id, is_required, sort_order)
    VALUES (section_financial, clause_rent, true, 1);
  END IF;
  IF clause_deposit IS NOT NULL THEN
    INSERT INTO template_section_clauses (section_id, clause_id, is_required, sort_order)
    VALUES (section_financial, clause_deposit, true, 2);
  END IF;

  -- Section: Tenant Obligations
  INSERT INTO template_sections (template_id, section_type, title, sort_order, is_required)
  VALUES (default_template_id, 'tenant_obligations', 'Tenant Obligations', 4, true)
  RETURNING id INTO section_tenant_oblig;
  SELECT id INTO clause_tenant_oblig FROM agreement_clauses WHERE category = 'terms_conditions' AND title = 'Tenant Obligations' LIMIT 1;
  IF clause_tenant_oblig IS NOT NULL THEN
    INSERT INTO template_section_clauses (section_id, clause_id, is_required, sort_order)
    VALUES (section_tenant_oblig, clause_tenant_oblig, true, 1);
  END IF;

  -- Section: Landlord Obligations
  INSERT INTO template_sections (template_id, section_type, title, sort_order, is_required)
  VALUES (default_template_id, 'landlord_obligations', 'Landlord Obligations', 5, true)
  RETURNING id INTO section_landlord_oblig;
  SELECT id INTO clause_landlord_oblig FROM agreement_clauses WHERE category = 'terms_conditions' AND title = 'Landlord Obligations' LIMIT 1;
  IF clause_landlord_oblig IS NOT NULL THEN
    INSERT INTO template_section_clauses (section_id, clause_id, is_required, sort_order)
    VALUES (section_landlord_oblig, clause_landlord_oblig, true, 1);
  END IF;

  -- Section: Requirements
  INSERT INTO template_sections (template_id, section_type, title, sort_order, is_required)
  VALUES (default_template_id, 'requirements', 'Tenancy Requirements', 6, false)
  RETURNING id INTO section_requirements;
  SELECT id INTO clause_smoking FROM agreement_clauses WHERE category = 'tenancy_requirements' AND title = 'Smoking Policy' LIMIT 1;
  SELECT id INTO clause_subletting FROM agreement_clauses WHERE category = 'tenancy_requirements' AND title = 'Subletting & Assignment' LIMIT 1;
  SELECT id INTO clause_occupation FROM agreement_clauses WHERE category = 'tenancy_requirements' AND title = 'Occupation & Use' LIMIT 1;
  SELECT id INTO clause_gardens FROM agreement_clauses WHERE category = 'tenancy_requirements' AND title = 'Gardens & External Areas' LIMIT 1;
  SELECT id INTO clause_refuse FROM agreement_clauses WHERE category = 'tenancy_requirements' AND title = 'Refuse & Recycling' LIMIT 1;
  IF clause_smoking IS NOT NULL THEN
    INSERT INTO template_section_clauses (section_id, clause_id, is_required, sort_order) VALUES (section_requirements, clause_smoking, false, 1);
  END IF;
  IF clause_subletting IS NOT NULL THEN
    INSERT INTO template_section_clauses (section_id, clause_id, is_required, sort_order) VALUES (section_requirements, clause_subletting, false, 2);
  END IF;
  IF clause_occupation IS NOT NULL THEN
    INSERT INTO template_section_clauses (section_id, clause_id, is_required, sort_order) VALUES (section_requirements, clause_occupation, false, 3);
  END IF;
  IF clause_gardens IS NOT NULL THEN
    INSERT INTO template_section_clauses (section_id, clause_id, is_required, sort_order) VALUES (section_requirements, clause_gardens, false, 4);
  END IF;
  IF clause_refuse IS NOT NULL THEN
    INSERT INTO template_section_clauses (section_id, clause_id, is_required, sort_order) VALUES (section_requirements, clause_refuse, false, 5);
  END IF;

  -- Section: Special Clauses
  INSERT INTO template_sections (template_id, section_type, title, sort_order, is_required)
  VALUES (default_template_id, 'special_clauses', 'Special Clauses', 7, false)
  RETURNING id INTO section_special;
  SELECT id INTO clause_break FROM agreement_clauses WHERE category = 'special_clauses' AND title = 'Break Clause' LIMIT 1;
  SELECT id INTO clause_guarantor FROM agreement_clauses WHERE category = 'special_clauses' AND title = 'Guarantor Agreement' LIMIT 1;
  SELECT id INTO clause_furnishings FROM agreement_clauses WHERE category = 'special_clauses' AND title = 'Furnishings & Inventory' LIMIT 1;
  SELECT id INTO clause_joint_liability FROM agreement_clauses WHERE category = 'special_clauses' AND title = 'Joint & Several Liability' LIMIT 1;
  SELECT id INTO clause_data_protection FROM agreement_clauses WHERE category = 'special_clauses' AND title = 'Data Protection & Privacy' LIMIT 1;
  IF clause_break IS NOT NULL THEN
    INSERT INTO template_section_clauses (section_id, clause_id, is_required, sort_order) VALUES (section_special, clause_break, false, 1);
  END IF;
  IF clause_guarantor IS NOT NULL THEN
    INSERT INTO template_section_clauses (section_id, clause_id, is_required, sort_order) VALUES (section_special, clause_guarantor, false, 2);
  END IF;
  IF clause_furnishings IS NOT NULL THEN
    INSERT INTO template_section_clauses (section_id, clause_id, is_required, sort_order) VALUES (section_special, clause_furnishings, false, 3);
  END IF;
  IF clause_joint_liability IS NOT NULL THEN
    INSERT INTO template_section_clauses (section_id, clause_id, is_required, sort_order) VALUES (section_special, clause_joint_liability, false, 4);
  END IF;
  IF clause_data_protection IS NOT NULL THEN
    INSERT INTO template_section_clauses (section_id, clause_id, is_required, sort_order) VALUES (section_special, clause_data_protection, false, 5);
  END IF;

  -- Section: Signatures
  INSERT INTO template_sections (template_id, section_type, title, sort_order, is_required)
  VALUES (default_template_id, 'signatures', 'Signatures', 8, true)
  RETURNING id INTO section_signatures;
END $$;
