-- ============================================================
-- Update default AST template with comprehensive tenancy agreement
-- Based on Assured Periodic Tenancy under Housing Act 1988 Section 4A
-- ============================================================

UPDATE agreement_defaults
SET
  name = 'Assured Periodic Tenancy Agreement',
  body_html = $body$
<style>
  .agreement-body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #000; }
  .agreement-body h1 { font-size: 14pt; text-align: center; text-decoration: underline; margin: 16px 0 4px; }
  .agreement-body h2 { font-size: 12pt; margin: 20px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  .agreement-body h3 { font-size: 11pt; margin: 14px 0 6px; }
  .agreement-body p { margin: 4px 0; text-align: justify; }
  .agreement-body ul { margin: 4px 0 4px 20px; padding: 0; }
  .agreement-body li { margin: 2px 0; }
  .agreement-body .clause { margin-left: 24px; text-indent: -20px; margin-bottom: 4px; }
  .agreement-body .sub-clause { margin-left: 40px; text-indent: -20px; margin-bottom: 3px; }
  .agreement-body .section-divider { border: none; border-top: 1px solid #ccc; margin: 16px 0; }
  .agreement-body .center-text { text-align: center; }
  .agreement-body .bold { font-weight: bold; }
  .agreement-body .red-text { color: #cc0000; }
  .agreement-body .notice-box { text-align: center; font-size: 12pt; font-weight: bold; margin: 16px 0; padding: 12px; border: 1px solid #ccc; }
  .agreement-body table.family-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  .agreement-body table.family-table th, .agreement-body table.family-table td { border: 1px solid #000; padding: 4px 8px; font-size: 10pt; }
  .agreement-body table.details-table { border-collapse: collapse; margin: 4px 0; }
  .agreement-body table.details-table td { padding: 2px 8px; border: none; font-size: 10pt; }
  .agreement-body .signature-block { margin-top: 24px; }
  .agreement-body .signature-line { border-bottom: 1px solid #000; width: 300px; height: 40px; margin: 8px 0; }
</style>
<div class="agreement-body">

<h1>ASSURED PERIODIC TENANCY AGREEMENT</h1>
<p><strong>For letting a dwelling on an Assured Periodic Tenancy under section 4A of the Housing Act 1988</strong></p>

<p><strong>DATE: {{today_date}}</strong></p>

<h3>1. Contract Details</h3>
<ul>
  <li><strong>Move in Date:</strong> {{start_date}}</li>
</ul>

<hr class="section-divider"/>

<h3>2. Parties</h3>
<ul>
  <li><strong>Tenant(s):</strong> {{tenant_name}}</li>
  <li><strong>Date of Birth:</strong> {{tenant_dob}}</li>
  <li><strong>Contact Number:</strong> {{tenant_phone}}</li>
  <li><strong>Email:</strong> {{tenant_email}}</li>
  <li><strong>Passport / Driving Licence Number:</strong> {{tenant_id_number}}</li>
</ul>

<hr class="section-divider"/>

<h3>3. Property</h3>
<ul>
  <li><strong>Property Address:</strong> {{property_address}}, {{property_postcode}}</li>
</ul>

<hr class="section-divider"/>

<h3>5. Utilities and Charges <u>(All Bills paid by Tenant)</u></h3>
<ul>
  <li><strong>Gas Meter:</strong> {{gas_meter_number}}</li>
  <li><strong>Electric Meter:</strong> {{electric_meter_number}}</li>
  <li><strong>Water Charges:</strong> {{water_charges}}</li>
  <li><strong>Council Tax:</strong> {{council_tax_band}}</li>
</ul>

<hr class="section-divider"/>

<h2>TENANCY INVENTORY AND AGREEMENT SUMMARY</h2>

<h3>1. Inventory</h3>
<p>This inventory records the items provided by the Landlord at the property. It has been agreed and signed by both the Landlord and the Tenant.</p>

<p><strong>Living Room</strong></p>
<ul><li>{{inventory_living_room}}</li></ul>

<p><strong>Kitchen</strong></p>
<ul><li>{{inventory_kitchen}}</li></ul>

<p><strong>Electrical Items Provided</strong></p>
<p>The Tenant has been provided with the following items:</p>
<ul><li>{{inventory_electrical_items}}</li></ul>

<p><strong>Condition &amp; Responsibility:</strong><br/>
The Tenant agrees to take reasonable care of the provided item. If the item is damaged due to misuse or negligence by the Tenant, the Tenant will be responsible for the cost of repair or replacement.<br/>
Any costs may be deducted from the tenancy deposit where appropriate.</p>

<hr class="section-divider"/>

<h3>2. Bedrooms</h3>
<ul>
  <li><strong>Bedroom 1:</strong> {{inventory_bedroom_1}}</li>
  <li><strong>Bedroom 2:</strong> {{inventory_bedroom_2}}</li>
  <li><strong>Bedroom 3:</strong> {{inventory_bedroom_3}}</li>
</ul>

<hr class="section-divider"/>

<h3>3. Rent/Deposit</h3>
<p>The rent for the property is <strong>{{rent_amount}} per {{rent_frequency}}</strong>, payable on the <strong>{{rent_day}} of each month</strong>.</p>
<p><strong>The deposit of this property {{deposit_amount}} paid is full.</strong></p>

<hr class="section-divider"/>

<h3>Tenant Information Declaration</h3>
<p>I confirm that the information I have provided in this form is true and accurate to the best of my knowledge.<br/>
I understand that if any information is found to be false or misleading, I may be reported to the relevant authorities, and my tenancy may be terminated with a notice to leave the property.</p>

<hr class="section-divider"/>

<p><strong>Signed by Landlord / Letting Agent:</strong></p>
<p>[SIGNATURE:agent]</p>

<p><strong>Signed by Tenant:</strong></p>
<p>[SIGNATURE:tenant]</p>

<br/>

<div class="notice-box">
Please note this tenancy agreement is an important document. It may commit you to certain actions for the duration of the tenancy. Please ensure that if you do not understand your legal rights, you consult a housing advice centre, solicitor or Citizens Advice.
</div>

<p class="center-text">This tenancy agreement is subject to any existing tenant and/or, any other occupiers, vacating the Property and the Property still being available to let, for example, including but not limited to, being damaged by fire or flood. For the avoidance of doubt in any of these circumstances this tenancy agreement will not take effect.</p>

<hr class="section-divider"/>

<p class="center-text">This document is the written statement of the terms of the tenancy that the Landlord is required to provide. When this document is signed by the Tenant and the Landlord it will be the tenancy agreement. Those parts fulfilling the written statement requirements have an * at the start.</p>

<hr class="section-divider"/>

<p class="red-text"><u><strong>Rent Payment Note</strong></u></p>
<ul>
  <li>If the rent is <strong>more than three days late</strong>, an additional <span class="red-text"><strong>£50 charge</strong></span> will be applied.</li>
</ul>

<hr class="section-divider"/>

<br/><br/>

<h2>Landlord Details</h2>
<table class="details-table">
  <tr><td><strong>Name:</strong></td><td>{{landlord_name}}</td></tr>
  <tr><td><strong>Telephone No.:</strong></td><td>{{landlord_phone}}</td></tr>
  <tr><td><strong>Email:</strong></td><td>{{landlord_email}}</td></tr>
  <tr><td><strong>Landlord Address:</strong></td><td>{{landlord_address}}</td></tr>
</table>

<br/>

<h2 class="center-text red-text">NOTICE TO TENANTS</h2>

<p>We would like to inform you that <strong>{{agency_name}}</strong> is acting on behalf of the landlord for all <u>maintenance and service-related inquiries</u>. Kindly direct any such requests to {{agency_name}} to ensure an efficient resolution. Please refrain from contacting the landlord, unless there is an emergency.</p>

<p><u>For all service-related matters, please use the following contact details:</u></p>
<table class="details-table">
  <tr><td><strong>Telephone:</strong></td><td>{{agency_phone}}</td></tr>
  <tr><td><strong>Email:</strong></td><td>{{agency_email}}</td></tr>
  <tr><td><strong>Emergency Number:</strong></td><td>{{agency_emergency_phone}}</td></tr>
</table>

<p><u>Please note that the emergency number should only be used outside of our regular business hours, which are as follows:</u></p>
<table class="details-table">
  <tr><td><strong>Monday to Friday:</strong></td><td>10am – 5pm</td></tr>
  <tr><td><strong>Weekends:</strong></td><td>Closed</td></tr>
</table>

<p>Our comprehensive complaints procedure is accessible on our official website at {{agency_website}}, providing you with detailed guidance on addressing any concerns you may have.</p>
<p>Should you have any questions or require further assistance, do not hesitate to reach out to us using the provided contact information.</p>
<p>Thank you for your cooperation.</p>

<br/>

<h3 class="red-text"><u>Payment Details</u></h3>
<table class="details-table">
  <tr><td><strong>Bank Name:</strong></td><td>{{bank_name}}</td></tr>
  <tr><td><strong>Sort Code:</strong></td><td>{{bank_sort_code}}</td></tr>
  <tr><td><strong>Account Number:</strong></td><td>{{bank_account_number}}</td></tr>
  <tr><td><strong>Reference Number:</strong></td><td>{{payment_reference}}</td></tr>
</table>

<br/>

<h2>OTHER FAMILY MEMBER</h2>
<table class="family-table">
  <thead>
    <tr><th>NO</th><th>NAME</th><th>D.O.B</th><th>RELATION</th></tr>
  </thead>
  <tbody>
    <tr><td>1</td><td>{{family_member_1_name}}</td><td>{{family_member_1_dob}}</td><td>{{family_member_1_relation}}</td></tr>
    <tr><td>2</td><td>{{family_member_2_name}}</td><td>{{family_member_2_dob}}</td><td>{{family_member_2_relation}}</td></tr>
    <tr><td>3</td><td>{{family_member_3_name}}</td><td>{{family_member_3_dob}}</td><td>{{family_member_3_relation}}</td></tr>
    <tr><td>4</td><td></td><td></td><td></td></tr>
    <tr><td>5</td><td></td><td></td><td></td></tr>
    <tr><td>6</td><td></td><td></td><td></td></tr>
    <tr><td>7</td><td></td><td></td><td></td></tr>
    <tr><td>8</td><td></td><td></td><td></td></tr>
    <tr><td>9</td><td></td><td></td><td></td></tr>
    <tr><td>10</td><td></td><td></td><td></td></tr>
  </tbody>
</table>

<!-- ================================================================ -->
<!-- LEGAL CLAUSES: Section 1 - Parties & Definitions                 -->
<!-- ================================================================ -->

<h2>1. Parties &amp; Definitions</h2>

<p class="clause"><strong>1.1.1</strong> *The Landlord: {{landlord_name}} of {{landlord_address}} (Email: {{landlord_email}}, Tel: {{landlord_phone}})</p>
<p class="clause"><strong>1.1.2</strong> *The Tenant: {{tenant_name}}</p>
<p>Where the party consists of more than one entity or person, the obligations apply to and are enforceable against them, jointly and severally.</p>

<p class="clause"><strong>1.1.3</strong> Permitted Occupiers: {{permitted_occupiers}}<br/>
In addition to the Tenant, Permitted Occupiers are the only people allowed to live in the Property, but they do not have any rights or obligations as per the Tenant listed in clause 1.1.2, and are only permitted to reside at the Property with the permission of the Tenant.</p>

<p class="clause"><strong>1.1.4</strong> Relevant Person<br/>
Under the Housing Act 2004 any person or body that provides the tenancy deposit for a section 4A assured tenancy is called a Relevant Person. {{relevant_person_declaration}} For this tenancy there is no Relevant Person as the Deposit is provided by the Tenant.</p>
<p class="clause">The Relevant Person is:</p>
<table class="details-table">
  <tr><td>Name:</td><td>{{relevant_person_name}}</td></tr>
  <tr><td>Contact Address:</td><td>{{relevant_person_address}}</td></tr>
  <tr><td>Contact Telephone Number:</td><td>{{relevant_person_phone}}</td></tr>
  <tr><td>Contact Email Address:</td><td>{{relevant_person_email}}</td></tr>
</table>

<p class="clause"><strong>1.1.5</strong> The Guarantor</p>
<table class="details-table">
  <tr><td>Name:</td><td>{{guarantor_name}}</td></tr>
  <tr><td>Contact Address:</td><td>{{guarantor_address}}</td></tr>
  <tr><td>Contact Telephone Number:</td><td>{{guarantor_phone}}</td></tr>
  <tr><td>Contact Email Address:</td><td>{{guarantor_email}}</td></tr>
</table>

<p class="clause"><strong>1.1.6</strong> Principal Contact<br/>
{{principal_contact}}</p>

<p class="clause">Where the party consists of more than one entity or person, the obligations apply to and are enforceable against them, jointly and severally. Joint and several liability means that any one of the members of a party can be held responsible for the full obligations under the tenancy agreement if the other members do not fulfil their obligations.</p>

<p class="clause">The parties listed above understand that the Landlord or Landlord's Agent may provide their name, address and other contact details to third parties including, but not limited to, the Landlord, the Tenant, contractors, referencing companies, utility providers, the local authority and any appropriate tenancy deposit scheme.</p>

<p class="clause">The parties listed above, and any Relevant Person or Guarantor listed in 1.1.4 and 1.1.5, agree, by signing this tenancy agreement, that the parties to the tenancy agreement, and the Landlord's Agent, may send information and important documents to the email addresses listed in 1.1.1, 1.1.2, 1.1.4 and 1.1.5.</p>

<p class="clause"><strong>1.2</strong> The "Landlord's Agent" shall mean {{agency_name}}, {{agency_address}}, {{agency_phone}}, {{agency_email}}, or such other agents as the Landlord may from time to time appoint.</p>

<p class="clause"><strong>1.3</strong> The Landlord lets, and the Tenant takes, the Property at the Rent payable, upon the terms and conditions of this tenancy agreement.</p>

<p class="clause"><strong>1.4</strong> This tenancy agreement is intended to create an assured tenancy as defined in section 4A of the Housing Act 1988.</p>

<h3>1.5 Property</h3>
<p class="clause"><strong>1.5.1</strong> *The Property, shall mean the property situated at and being {{property_address}}, {{property_postcode}}, together with the fixtures, fittings, furniture and effects therein, and more particularly specified in the Inventory signed by the Tenant, and all grounds. It shall include the right to use, in common with others, any shared rights of access, stairways, communal parts, paths and drives.</p>
<p class="clause"><strong>1.5.2</strong> The Property is {{hmo_status}} not let as a House in Multiple Occupation within the meaning of the Housing Act 2004. The Property does {{hmo_licence_status}} not require the Landlord to hold a license to be able to let it lawfully. The Tenant agrees not to use the Property in any way that changes either of these facts.</p>
<p class="clause"><strong>1.5.3</strong> {{hmo_licence_details}} The license for this Property allows a maximum of {{hmo_max_individuals}} individuals from {{hmo_max_families}} separate families. The Tenant agrees to do nothing that would breach these requirements.</p>

<h3>1.6 Rent</h3>
<p class="clause"><strong>1.6.1</strong> *The Rent shall be {{rent_amount}} per {{rent_frequency}}, from and including {{start_date}} until ended following either party giving notice. This is the date on which the Tenant is first entitled to possession under the tenancy. Please see clause 2.6 as it contains important information about what you must do to end the tenancy.</p>
<p class="clause"><strong>1.6.2</strong> The Rent shall be paid clear of unreasonable or unlawful deductions or set-off to the Principal Contact by banker's standing order or such other method as the Principal Contact shall require.</p>
<p class="clause"><strong>1.6.3</strong> The first rent payment of {{rent_amount}} is payable after the tenancy agreement has been entered into, but prior to taking possession.</p>
<p class="clause"><strong>1.6.4</strong> *Thereafter the "Rent Due Date" will be the {{rent_due_day}} day of each month throughout this tenancy agreement.</p>
<p class="clause"><strong>1.6.5</strong> Rental payments overdue by more than 14 days will be subject to interest at the rate of 3% over the Bank of England Base Rate calculated from the date the payment was due up until the date payment is received.</p>
<p class="clause"><strong>1.6.6</strong> Any person paying the Rent, or any part of it, for the Property during the tenancy shall be deemed to have paid it as agent, for and on behalf of the Tenant, which the Landlord shall be entitled to assume without enquiry.</p>
<p class="clause"><strong>1.6.7</strong> It is agreed that if the Principal Contact accepts money after one of the conditions which may lead to a claim for possession by the Landlord (these are the conditions listed in clause 3 below), acceptance of the money will not create a new tenancy and the Landlord will still, within the restrictions of the law, be able to pursue the claim for possession.</p>
<p class="clause"><strong>1.6.8</strong> *If for any reason the Tenant remains in possession of the Property, or the lawful Tenant of the Property, for more than 52 weeks, then the Rent may be reviewed. Any increase in the level of Rent must be made using a Housing Act 1988 section 13 notice. The new rent will take effect at least 52 weeks after commencement of the tenancy or at least 52 weeks after the last increase. Any increase will take effect from the beginning of a new period.</p>

<h3>1.7 Deposit</h3>
<p class="clause"><strong>1.7.1</strong> *The Deposit of {{deposit_amount}} will be paid by the Tenant prior to the date in clause 1.6.1.</p>
<p class="clause"><strong>1.7.2</strong> The Deposit will be paid to the Landlord / Landlord's Agent.</p>
<p class="clause"><strong>1.7.3</strong> No interest will be paid on the Deposit by the Landlord or Landlord's Agent.</p>
<p class="clause"><strong>1.7.4</strong> The Deposit has been taken for the following purposes:</p>
<p class="sub-clause"><strong>1.7.4.1</strong> Any damage, or compensation for damage, to the premises its fixtures and fittings or for missing items for which the Tenant may be liable, subject to an apportionment or allowance for fair wear and tear, the age and condition of each and any such item at the commencement of the tenancy, insured risks and repairs that are the responsibility of the Landlord.</p>
<p class="sub-clause"><strong>1.7.4.2</strong> The reasonable costs incurred in compensating the Landlord for, or for rectifying or remedying any major breach by the Tenant of the Tenant's obligations under the tenancy agreement, including those relating to the cleaning of the premises, its fixtures and fittings.</p>
<p class="sub-clause"><strong>1.7.4.3</strong> Any unpaid accounts for utilities or water charges or environmental services or other similar services incurred at the Property for which the Tenant is liable.</p>
<p class="sub-clause"><strong>1.7.4.4</strong> Any rent or other money due or payable by the Tenant under the tenancy agreement of which the Tenant has been made aware and which remains unpaid after the end of the tenancy.</p>
<p class="sub-clause"><strong>1.7.4.5</strong> The Deposit is held as security for the performance of the Tenant's obligations under this tenancy agreement and to compensate the Landlord for any breach of those obligations.</p>
<p class="clause"><strong>1.7.5</strong> Subject to the {{deposit_scheme}} scheme rules, the Deposit will be refunded, less any deductions, once the following have been completed:</p>
<p class="sub-clause"><strong>1.7.5.1</strong> the tenancy has ended and possession of the Property has been returned to the Landlord and</p>
<p class="sub-clause"><strong>1.7.5.2</strong> all keys, access devices, remote controls and parking permits have been returned and</p>
<p class="sub-clause"><strong>1.7.5.3</strong> both parties have confirmed their acceptance of any Deposit deductions.</p>
<p class="clause"><strong>1.7.6</strong> The Deposit is not transferable by the Tenant in any way.</p>
<p class="clause"><strong>1.7.7</strong> The Deposit will be protected by {{deposit_scheme}}, in accordance with the relevant scheme rules. The scheme rules and alternative dispute resolution rules governing the protection of the Deposit, including the repayment process, are provided and can also be found at www.mydeposits.co.uk.</p>
<p class="clause"><strong>1.7.8</strong> In the event that the total amount lawfully due at the end of the tenancy exceeds the amount of the Deposit, the Tenant shall reimburse the Principal Contact the further amount, within 14 days of the request being made.</p>
<p class="clause"><strong>1.7.9</strong> The Deposit will be refunded, less any deductions, to the Lead Tenant.</p>

<h3>1.8 Rights of Third Parties</h3>
<p class="clause">The parties intend that no clause of this tenancy agreement may be enforced by any third party, other than the Landlord's Agent, pursuant to the Contracts (Rights of Third Parties) Act 1999.</p>

<h3>1.9 Permissions</h3>
<p class="clause">Where Permission is required by the Tenant:</p>
<p class="sub-clause"><strong>1.9.1</strong> Permission, if granted, will be in writing from the Principal Contact.</p>
<p class="sub-clause"><strong>1.9.2</strong> Permission, if sought by the Tenant, will not be unreasonably withheld or delayed.</p>

<h3>1.10 Losses</h3>
<p class="clause"><strong>1.10.1</strong> Losses means all losses, damages and costs resulting from a breach of contract.</p>

<!-- ================================================================ -->
<!-- Section 2 - Legal Notices                                         -->
<!-- ================================================================ -->

<h2>2. Legal Notices</h2>

<h3>2.1 Section 47</h3>
<p class="clause">Under section 47 of the Landlord and Tenant Act 1987 the name and address of the Landlord is stated to be as in clause 1.1.1 of this tenancy agreement. An address within England and Wales for service of notices is as in clause 2.2.</p>

<h3>2.2 *Section 48 Landlord and Tenant Act 1987 and Renters' Rights Act 2025 written statement rules</h3>
<p class="clause">Until you are informed in writing to the contrary, notice is given pursuant to section 48(1) of the Landlord and Tenant Act 1987 that your Landlord's address for the service of all and any notices (including notices in proceedings) and all other correspondence is as stated in 1.1.1.</p>
<p class="clause">If the Tenant wishes to serve notice to end the tenancy, these are the details which should be used.</p>

<h3>2.3 Notice Service</h3>
<p class="clause"><strong>2.3.1</strong> Any notice given by or on behalf of the Landlord or any other document to be served on or given to the Tenant shall be deemed to have been served on or given to the Tenant if it is:</p>
<p class="sub-clause"><strong>2.3.1.1</strong> left at the Property during the tenancy, or the last known address of the Tenant at any time or</p>
<p class="sub-clause"><strong>2.3.1.2</strong> sent by ordinary post in a prepaid letter, properly addressed to the Tenant by name at the Property during the tenancy, or the last known address of the Tenant at any time or</p>
<p class="sub-clause"><strong>2.3.1.3</strong> sent by Signed for Delivery in a prepaid letter, properly addressed to the Tenant by name at the Property during the tenancy, or the last known address of the Tenant at any time or</p>
<p class="sub-clause"><strong>2.3.1.4</strong> personally served on the Tenant or any person making up the Tenant.</p>
<p class="sub-clause"><strong>2.3.1.5</strong> served via electronic means, including via the Current Contact Email Address listed in clause 1.1.2 or any other notified email address, during the tenancy, or the Post Tenancy Contact Email Address after the tenancy.</p>
<p class="clause"><strong>2.3.2</strong> Any notice given by the Tenant or any other document to be served on or given to the Landlord shall be deemed to have been served on or given to the Landlord if it is in written form including, but not limited to, being:</p>
<p class="sub-clause"><strong>2.3.2.1</strong> left at the office of the Landlord's Agent during the tenancy or the last known address of the Landlord's Agent at any time or</p>
<p class="sub-clause"><strong>2.3.2.2</strong> sent by ordinary post in a prepaid letter, properly addressed to the Landlord at the address in clause 2.2 or</p>
<p class="sub-clause"><strong>2.3.2.3</strong> sent by Signed for Delivery in a prepaid letter, properly addressed to the Landlord at the address in clause 2.2 or</p>
<p class="sub-clause"><strong>2.3.2.4</strong> personally served on the Landlord or any person making up the Landlord or acting on behalf of the Landlord.</p>
<p class="sub-clause"><strong>2.3.2.5</strong> supplied via electronic means, including via any email address listed in clause 2.2, at any time.</p>
<p class="clause"><strong>2.3.3</strong> If any notice or other document is served in person or left at the address in 2.3.1.1 or 2.3.1.2, service shall be deemed to have been on the day it was left.</p>
<p class="clause"><strong>2.3.4</strong> If any notice or other document is sent by post it shall be deemed to have been served 48 hours after it was posted.</p>
<p class="clause"><strong>2.3.5</strong> If any notice or other document is served by electronic means, the notice shall be deemed to have been served on the day it was sent.</p>
<p class="clause"><strong>2.3.6</strong> An email used in relation to email service shall be deemed served if delivered to a junk, spam or other similar folder of the recipient's email account or internet service provider.</p>

<h3>2.4 Post and Notices Received</h3>
<p class="clause"><strong>2.4.1</strong> The Tenant agrees to forward any correspondence addressed to the Landlord, and other notices, orders and directions affecting the Landlord, to the Principal Contact without delay. Where appropriate, the Tenant should take all reasonable steps to comply with any requirements, having first consulted with the Principal Contact.</p>

<h3>2.5 Criminal Convictions</h3>
<p class="clause"><strong>2.5.1</strong> The Tenant agrees to notify the Principal Contact of any convictions during the tenancy so that the Landlord can appropriately notify the insurance company.</p>

<h3>2.6 Notice Service by the Tenant</h3>
<p class="clause"><strong>2.6.1</strong> *The Tenant may bring the tenancy to an end by giving to the Landlord not less than two months' written notice, in accordance with section 5 of the Protection from Eviction Act 1977, stating that the Tenant wishes to vacate the Property. The notice must expire on the last or first day of a tenancy period.</p>

<!-- ================================================================ -->
<!-- Section 3 - Possession                                             -->
<!-- ================================================================ -->

<h2>3. Possession</h2>
<p class="clause"><strong>3.1</strong> *Without limiting the other rights and remedies of the Landlord, the Landlord must, in most circumstances, seek to lawfully terminate the tenancy by obtaining a court order, and it being executed by a bailiff appointed by the court where necessary, if:</p>
<p class="sub-clause"><strong>3.1.1</strong> the Rent, or any part of it, is in arrears, whether formally demanded or not, or</p>
<p class="sub-clause"><strong>3.1.2</strong> the Tenant is in breach of any of the obligations under this tenancy agreement, or</p>
<p class="sub-clause"><strong>3.1.3</strong> *the Landlord or, in the case of joint landlords, at least one of them must usually serve on the Tenant a notice of proceedings for possession which, amongst other requirements, is in the prescribed form and specifies the ground or grounds of possession from Schedule 2 of the Housing Act 1988. The grounds allow the Landlord to seek possession of the Property in specified circumstances, including rent arrears, damage to the Property, nuisance and breach of a condition of the tenancy agreement. The length of the notice will be dependent upon the grounds relied upon in a notice under section 8 of the Housing Act 1988.</p>
<p class="clause">Tenants who are unsure of their rights should seek appropriate advice.</p>

<!-- ================================================================ -->
<!-- Section 4 - Tenant's Obligations                                  -->
<!-- ================================================================ -->

<h2>4. Tenant's Obligations</h2>
<p>The Tenant agrees to:</p>

<h3>4.1 Payments</h3>
<p class="clause"><strong>4.1.1</strong> Pay the Rent on the day and in the manner specified. If the payment, or any part of the payment, will not be paid on the day specified, the Tenant agrees to notify the Principal Contact in advance to allow the Landlord to plan and discuss a solution.</p>
<p class="clause"><strong>4.1.2</strong> Pay to the service providers a fair proportion of all charges, based on usage and the length of the tenancy, including water and sewerage charges, the council tax or any replacement taxation and for all gas, electricity, oil or other fuel consumed on the Property and all charges for the telephone and broadband charges, cable and satellite for the duration of the tenancy.</p>
<p class="clause"><strong>4.1.3</strong> Pay for the reconnection of water, gas, electricity or telephone if the disconnection results from any act or omission of the Tenant or the Tenant's agents.</p>
<p class="clause"><strong>4.1.4</strong> Not to provide a cheque or other payment that the bank then fails to honor.</p>
<p class="clause"><strong>4.1.5</strong> Notify the relevant authorities, where the bills are payable to the provider, and arrange and pay final accounts on possession being returned to the Landlord.</p>
<p class="clause"><strong>4.1.6</strong> Pay the full costs, on an indemnity basis, where the Landlord takes court action for breach of contract or possession of the Property, including court fees and all other associated costs, limited to only those costs the court awards.</p>
<p class="clause"><strong>4.1.7</strong> Pay damages to the Landlord if the Tenant breaches any of the conditions of this tenancy agreement, subject to any statutory limitations.</p>

<h3>4.2 Repairs</h3>
<p class="clause"><strong>4.2.1</strong> Keep the Property including all of the Landlord's machinery and equipment clean and tidy and in good and tenantable condition and decorative order, (reasonable wear and tear, items which the Landlord is responsible to maintain, and damage for which the Landlord has agreed to insure, excepted).</p>
<p class="clause"><strong>4.2.2</strong> Not permit any waste, injury or damage to the Property, the Landlord's fixtures, fittings and appliances, nor make any alteration or addition to the Property or the style or colour of the decorations without Permission.</p>
<p class="clause"><strong>4.2.3</strong> Notify the Principal Contact promptly of any wet rot, dry rot or infestation by wood boring insects.</p>
<p class="clause"><strong>4.2.4</strong> The Tenant must not, and must not permit their friends or visitors to, do anything that may result in glass in the Property being broken.</p>
<p class="clause"><strong>4.2.5</strong> Undertake promptly any repairs for which the Tenant is liable following any notice being served by the Principal Contact and if the Tenant does not carry out the repairs, the Landlord may, after correct written notice, enter the Property, with or without others, to effect those repairs and the Tenant will pay on demand the reasonable costs involved.</p>
<p class="clause"><strong>4.2.6</strong> Test all smoke and carbon monoxide alarms monthly and to clean the alarms on a three-monthly basis using the soft brush of a vacuum cleaner.</p>
<p class="clause"><strong>4.2.7</strong> Not alter the operation of, or disable, the smoke or carbon monoxide alarms.</p>
<p class="clause"><strong>4.2.8</strong> Not cause an avoidable call-out by a contractor.</p>
<p class="clause"><strong>4.2.9</strong> Attend any agreed appointments.</p>
<p class="clause"><strong>4.2.10</strong> Not arrange contractors without Permission, unless acting reasonably to effect emergency repairs for which the Landlord is liable.</p>

<h3>4.3 The Property</h3>
<p class="clause"><strong>4.3.1</strong> Promptly notify the Principal Contact in writing when the Tenant becomes aware of:</p>
<p class="sub-clause"><strong>4.3.1.1</strong> any defect, damage or disrepair in the Property including any shared rights of access, stairways, communal parts, paths and drives,</p>
<p class="sub-clause"><strong>4.3.1.2</strong> any situation in the Property which may cause the Property not to be fit for human habitation.</p>
<p class="sub-clause"><strong>4.3.1.3</strong> any loss, damage or occurrence which may give rise to a claim under the Landlord's insurance.</p>
<p class="clause"><strong>4.3.2</strong> Where reasonable to do so, co-operate in the making of any claim under the Landlord's insurance.</p>
<p class="clause"><strong>4.3.3</strong> Use the Property in the manner a responsible and conscientious tenant would.</p>
<p class="clause"><strong>4.3.4</strong> Ensure the windows of the Property are cleaned in a safe manner as often as necessary and in the last two weeks of the tenancy.</p>
<p class="clause"><strong>4.3.5</strong> Not remove any of the Landlord's possessions from the Property or store them in any cellar or outside the main dwelling.</p>
<p class="clause"><strong>4.3.6</strong> Not exhibit any promotional poster or notice so as to be visible from outside the Property.</p>
<p class="clause"><strong>4.3.7</strong> Not affix any notice, sign, poster or other thing to the internal or external surfaces of the Property in such a way as to cause any damage.</p>
<p class="clause"><strong>4.3.8</strong> Not cause, or unreasonably permit, any blockage to the drains, pipes, gutters and channels in or about the Property.</p>
<p class="clause"><strong>4.3.9</strong> Not assign, underlet or part with or share possession of the whole or any part of the Property without Permission.</p>
<p class="clause"><strong>4.3.10</strong> Not permit any visitor to stay in the Property for a period of more than three weeks within any three-month period without Permission.</p>
<p class="clause"><strong>4.3.11</strong> Permit the Principal Contact or others, after giving 24 hours' written notice and at reasonable hours of the daytime, to enter the Property:</p>
<p class="sub-clause"><strong>4.3.11.1</strong> to view the state and condition and to execute repairs and other works upon the Property or other properties, or</p>
<p class="sub-clause"><strong>4.3.11.2</strong> to show prospective purchasers the Property at all times during the tenancy and to erect a board to indicate that the Property is for sale, or</p>
<p class="sub-clause"><strong>4.3.11.3</strong> to show prospective tenants the Property, during the last two months of the tenancy and to erect a board to indicate that the Property is to let.</p>
<p class="sub-clause"><strong>4.3.11.4</strong> to take photographs for use in promoting the Property for sale or rental or evidence of damage or breach of the tenancy agreement.</p>
<p class="clause"><strong>4.3.12</strong> Where the Landlord or the Landlord's Agent have served a valid written notice of the need to enter to view the state and condition or to effect works (except in case of emergency when access shall be immediate), the Tenant agrees to them using their keys to gain access if the Tenant is unable to grant access.</p>
<p class="clause"><strong>4.3.13</strong> Not add any aerial, antenna or satellite dish to the building without Permission.</p>
<p class="clause"><strong>4.3.14</strong> Not change the locks (or install additional locks) to any doors in the Property, nor make additional keys for the locks without Permission. All keys, access devices, remote controls and parking permits are to be returned when possession of the Property is returned to the Landlord.</p>
<p class="clause"><strong>4.3.15</strong> Ensure that the Property is kept secure at all times, locking doors and windows and activating burglar alarms as appropriate.</p>
<p class="clause"><strong>4.3.16</strong> The Tenant must, except in the event of an emergency, ensure that when going outside the Property, they have keys or other access devices to regain access.</p>
<p class="clause"><strong>4.3.17</strong> The Tenant must ensure that the keys or other access devices are not kept or transported in such a way that the Property address can be identified if the keys or other access devices are lost or stolen.</p>
<p class="clause"><strong>4.3.18</strong> Keep the Property, at all times, sufficiently well aired and warmed to avoid build-up of condensation and prevent mildew growth and to protect it from freezing weather.</p>
<p class="clause"><strong>4.3.19</strong> Not block ventilators or extractors and not to turn off isolator switches provided in the Property.</p>
<p class="clause"><strong>4.3.20</strong> Report to the Principal Contact any brown or sooty build up around gas appliances or any suspected faults with the appliances.</p>
<p class="clause"><strong>4.3.21</strong> Not use any gas appliance that has been declared unsafe by a statutorily approved contractor, or disconnected from the supply.</p>
<p class="clause"><strong>4.3.22</strong> Except as provided by the Landlord:</p>
<p class="sub-clause"><strong>4.3.22.1</strong> Not keep, use or permit to be used on the Property any portable fuel burning appliance including oil stoves and paraffin heaters.</p>
<p class="sub-clause"><strong>4.3.22.2</strong> Not keep, use or permit to be used on the Property any other appliance against the terms of the insurance of the Property.</p>
<p class="sub-clause"><strong>4.3.22.3</strong> Not leave any lit candles unattended.</p>
<p class="sub-clause"><strong>4.3.22.4</strong> Not light bonfires or set off fireworks within the curtilage of the Property.</p>
<p class="sub-clause"><strong>4.3.22.5</strong> Not use any electrical appliances that are not marked CE or UKCA.</p>
<p class="sub-clause"><strong>4.3.22.6</strong> Not leave unattended any batteries in the Property on charge and ensure charging is carried out in accordance with manufacturer's instructions.</p>
<p class="clause"><strong>4.3.23</strong> Be responsible for ensuring that any television used is correctly and continually licensed.</p>
<p class="clause"><strong>4.3.24</strong> Not keep motorcycles, cycles, e-bikes, e-scooters or other similar machinery in any communal areas, or inside the Property, except in any defined outside area or garage.</p>
<p class="clause"><strong>4.3.25</strong> Perform and observe all valid obligations of any headlease or covenant on the Property.</p>
<p class="clause"><strong>4.3.26</strong> Not keep any vehicle that is not validly licensed for use on the highway, any commercial vehicle, boat, caravan, trailer, hut or shed on the Property.</p>
<p class="clause"><strong>4.3.27</strong> Not prop open any fire doors in the Property, except by any built-in system that closes them in the event of a fire, and not disable or interfere with any self-closing mechanism.</p>
<p class="clause"><strong>4.3.28</strong> The Tenant agrees that the Landlord is not liable to compensate the Tenant for any works carried out to the Property which the Tenant arranges.</p>
<p class="clause"><strong>4.3.29</strong> Not do any cutting or chopping directly on the work surfaces in the kitchen, or mark the work surfaces in any way.</p>
<p class="clause"><strong>4.3.30</strong> Not to cause damage to the Property by the inappropriate drying of clothes or other articles.</p>
<p class="clause"><strong>4.3.31</strong> Where an oven grill is designed to be used with the door shut the Tenant shall not use the grill with the door open.</p>
<p class="clause"><strong>4.3.32</strong> Toasters and kettles must not be used directly underneath kitchen wall units.</p>
<p class="clause"><strong>4.3.33</strong> Not to introduce any waterbed or hot tub into the Property without Permission.</p>
<p class="clause"><strong>4.3.34</strong> Comply with the control measures contained within the Legionella Risk Assessment given at the commencement of the tenancy.</p>
<p class="clause"><strong>4.3.35</strong> Not keep any pet, animal, bird, reptile, fish, insect or the like on the Property, without Permission.</p>
<p class="clause"><strong>4.3.36</strong> {{garden_maintenance}} Keep the garden and grounds properly cultivated according to the season and free from weeds, in a neat and tidy condition with the lawns regularly mown and edged, and shrubs and trees pruned.</p>
<p class="clause"><strong>4.3.37</strong> Not cause obstruction in any common areas of any building of which the Property forms a part.</p>
<p class="clause"><strong>4.3.38</strong> The loft is not considered safe for the Tenant to access or use as storage. The Tenant agrees not to access the loft space at the Property or use it for storage or any other purpose.</p>

<h3>4.4 General</h3>
<p class="clause"><strong>4.4.1</strong> Not permit or suffer to be done on the Property anything which may be, or may be likely to cause, a nuisance or annoyance to a person residing, visiting or otherwise engaged in a lawful activity in the locality.</p>
<p class="clause"><strong>4.4.2</strong> Not make or permit any noise or to play any radio, television or other equipment in or about the Property between the hours of 11pm and 7am so as to be an audible nuisance outside the Property.</p>
<p class="clause"><strong>4.4.3</strong> The Tenant shall not carry on any profession, trade or business at the Property including a "home business" as defined by section 43ZA Landlord and Tenant Act 1954, nor allow anyone else to do so, without prior Permission.</p>
<p class="clause"><strong>4.4.4</strong> Not permit or suffer anything to be done on the Property that may constitute negligence, misuse or a failure to act reasonably which may render the Landlord's insurance of the Property void or voidable.</p>
<p class="clause"><strong>4.4.5</strong> Not use, or suffer the Property to be used, for any illegal or immoral purpose.</p>
<p class="clause"><strong>4.4.6</strong> Promptly notify the Principal Contact if the Property becomes the subject of proceedings under the Matrimonial Causes Act 1973 or the Family Law Act 1996.</p>
<p class="clause"><strong>4.4.7</strong> Have the use of all appliances provided in the Property, as listed in the inventory, save those which are noted as not working.</p>
<p class="clause"><strong>4.4.8</strong> Not leave the Property vacant for more than 28 days without providing the Principal Contact with reasonable notice in advance.</p>
<p class="clause"><strong>4.4.9</strong> Check the inventory and report any errors/deficiencies, returning a signed copy with any annotations/corrections as necessary within seven days of move in.</p>
<p class="clause"><strong>4.4.10</strong> Not change the supplier of utility services without Permission.</p>
<p class="clause"><strong>4.4.11</strong> Ensure that all adult occupiers of the Property maintain a "Right to Rent", as defined by the Immigration Act 2014, at all times during the tenancy.</p>
<p class="clause"><strong>4.4.12</strong> Not leave food or other material around that will attract vermin.</p>
<p class="clause"><strong>4.4.13</strong> Not to make any changes to the electrical installation.</p>
<p class="clause"><strong>4.4.14</strong> Reside in the Property as their only or principal residence.</p>
<p class="clause"><strong>4.4.15</strong> As per the manufacturer's instructions, the Tenant can connect their electronic equipment to the Property's 'smart' devices, where fitted, unless the Landlord explicitly prohibits a specific device.</p>
<p class="clause"><strong>4.4.16</strong> Not to interfere with the supply of electricity, gas or water and associated equipment.</p>
<p class="clause"><strong>4.4.17</strong> Not disable or alter the operation or code of the burglar alarm.</p>
<p class="clause"><strong>4.4.18</strong> Not to smoke (including vaping and shisha pipes) within any buildings on the Property and not to permit their friends, permitted occupiers or visitors to smoke within any buildings on the Property.</p>

<h3>4.5 Insurance</h3>
<p class="clause"><strong>4.5.1</strong> Be responsible for effecting any insurance the Tenant requires for their own possessions.</p>
<p class="clause"><strong>4.5.2</strong> The Landlord does not provide any insurance cover for the Tenant's possessions.</p>

<h3>4.6 End of Tenancy</h3>
<p class="clause"><strong>4.6.1</strong> Return possession of the Property in the same good clean state and condition as it was originally provided to the Tenant, and make good, pay for the repair of, or replace all such items of the fixtures, fittings, furniture and effects as shall be broken, lost, damaged or destroyed during that time (reasonable wear and tear excepted).</p>
<p class="clause"><strong>4.6.2</strong> Return all keys, access devices, remote controls and parking permits for the Property, on the last day of possession (or sooner by mutual arrangement).</p>
<p class="clause"><strong>4.6.3</strong> Return all the linen and blankets, bedding, carpets and curtains which have been soiled during the tenancy, in the same condition as at the start of the tenancy (fair wear and tear excepted).</p>
<p class="clause"><strong>4.6.4</strong> Leave the oven and other appliances in the same state of cleanliness as listed in the inventory.</p>
<p class="clause"><strong>4.6.5</strong> Leave the fixtures fittings, furniture and effects at the end of the tenancy in the rooms and places in which they were at the beginning of the tenancy.</p>
<p class="clause"><strong>4.6.6</strong> Remove all rubbish from the Property, not to overfill any bin and to use the relevant bins according to the local authority guidance.</p>
<p class="clause"><strong>4.6.7</strong> Keep the appointment to check the inventory at the end of the tenancy.</p>
<p class="clause"><strong>4.6.8</strong> The Landlord or the Landlord's Agent disposing of any goods left in the Property after the Tenant has vacated.</p>
<p class="clause"><strong>4.6.9</strong> Cancel their standing order, or other rent payment instruction, once all Rent has been paid.</p>

<!-- ================================================================ -->
<!-- Section 5 - Landlord's Obligations                                -->
<!-- ================================================================ -->

<h2>5. Landlord's Obligations</h2>
<p>The Landlord agrees with the Tenant as follows:</p>

<p class="clause"><strong>5.1</strong> To pay all assessments and outgoings in respect of the Property (except those for which responsibility is assumed by the Tenant under this tenancy agreement).</p>
<p class="clause"><strong>5.2</strong> To allow the Tenant quiet enjoyment of the Property during the tenancy without any unlawful interruption from the Landlord or any person lawfully acting on behalf of the Landlord.</p>
<p class="clause"><strong>5.3</strong> To return to the Tenant any Rent paid for any period while the Property is rendered uninhabitable by fire or other risk for which the Landlord has agreed to insure.</p>
<p class="clause"><strong>5.4</strong> That the Landlord is the sole owner of the leasehold or freehold interest in the Property and that all necessary consents to allow the Landlord to enter into this tenancy agreement have been obtained in writing.</p>
<p class="clause"><strong>5.5</strong> To maintain a comprehensive insurance policy with a reputable company to cover the Property, and the Landlord's fixtures, fittings, furniture and effects, but not including the Tenant's belongings or liabilities for damage.</p>
<p class="clause"><strong>5.6</strong> That the Landlord will not be responsible for any loss or inconvenience suffered as a result of a failure of supply or service to the Property, supplied by a third party, where such failure is not caused by an act or omission on the part of the Landlord.</p>
<p class="clause"><strong>5.7</strong> To provide a copy of the insurance and any freehold or headlease conditions affecting the behavior of the Tenant.</p>
<p class="clause"><strong>5.8</strong> Pay the Tenant's reasonable costs, reasonably incurred and which cannot be mitigated, if the Landlord or the Landlord's Agent fail to keep the appointment to check the inventory at the end of the tenancy and another visit has to be scheduled.</p>
<p class="clause"><strong>5.9</strong> *To fulfil the repairing obligations contained within Section 11(1) of the Landlord and Tenant Act 1985. These are quoted below:</p>
<p>(a) to keep in repair the structure and exterior of the dwelling-house (including drains, gutters and external pipes);</p>
<p>(b) to keep in repair and proper working order the installations in the dwelling-house for the supply of water, gas and electricity and for sanitation (including basins, sinks, baths and sanitary conveniences, but not other fixtures, fittings and appliances for making use of the supply of water, gas or electricity); and</p>
<p>(c) to keep in repair and proper working order the installations in the dwelling-house for space heating and heating water.</p>
<p class="clause"><strong>5.10</strong> *That in accordance with section 9A of the Landlord and Tenant Act 1985 the Landlord is under an obligation to ensure that the Property is fit for human habitation at the start of the tenancy and kept that way during the tenancy.</p>
<p class="clause"><strong>5.11</strong> *To fulfil the obligations of the Electrical Safety Standards in the Private Rented Sector. These are stated below:</p>
<p>(a) to ensure that relevant electrical safety standards are met during any period when the Property is occupied under the tenancy,</p>
<p>(b) to ensure relevant electrical installations in the Property are inspected and tested by a qualified person at least every five years or, if required by the most recent report, earlier, and</p>
<p>(c) to obtain a report from the person conducting that inspection and test, which gives the results and the date by which the next inspection and test is required, and to supply a copy of that report to the Tenant.</p>
<p class="clause"><strong>5.12</strong> *To comply with section 190 of the Equality Act 2010 (improvements to let dwelling houses) —</p>
<p>(a) section 190 has the effect that a landlord may not unreasonably withhold consent to a tenant's application to make an improvement to premises where—</p>
<p class="sub-clause">(i) a disabled person occupies or intends to occupy the premises as their only or main home, and</p>
<p class="sub-clause">(ii) the improvement is likely to facilitate the disabled person's enjoyment of the premises, having regard to their disability, and</p>
<p>(b) the rights and obligations conferred by section 190 do not apply in so far as provision of a like nature is made by the tenancy agreement.</p>
<p class="clause"><strong>5.13</strong> *The Tenant may keep a pet at the Property if the Tenant asks to do so, in accordance with section 16A and 16B of the Housing Act 1988 and the Landlord gives Permission. Such Permission is not to be unreasonably refused by the Landlord.</p>
<p class="clause"><strong>5.14</strong> *To fulfil the obligations of regulation 36 of the Gas Safety (Installation and Use Regulations) 1998. These are stated below:</p>
<p>(a) to ensure that there is maintained in a safe condition any relevant gas fitting and any relevant flue which serves a relevant gas fitting,</p>
<p>(b) to ensure that each appliance and flue to which that duty extends is checked for safety—</p>
<p class="sub-clause">(i) by, or by an employee of, a member of a class of persons approved, at the time of the check, by the Health and Safety Executive, and</p>
<p class="sub-clause">(ii) at intervals to be determined in accordance with the 1998 regulations, and</p>
<p>(c) to ensure that a record in respect of any appliance or flue so checked is made and, subject to exceptions, that a copy of that record is given to the Tenant.</p>
<p>This paragraph applies if there is a relevant gas fitting installed in or serving the Property and that gas fitting is one to which the 1998 regulations apply.</p>

<!-- ================================================================ -->
<!-- Section 6 - Deposit Prescribed Information                         -->
<!-- ================================================================ -->

<h2>6. Deposit Prescribed Information</h2>

<p class="clause"><strong>6.1</strong> The contact details for this scheme are as follows:</p>
<p class="clause">Name: Deposits Protection Service</p>
<p class="clause">Address: The Pavilions, Bridgwater Road, Bristol, BS13 8AE</p>
<p class="clause">Telephone number: 03303030030</p>
<p class="clause">Email Address: support@depositprotection.com</p>

<p class="clause"><strong>6.2</strong> The scheme supply a leaflet for tenants and the information in that leaflet is provided with this tenancy. Please see www.mydeposits.co.uk for further information provided by the scheme.</p>
<p class="clause"><strong>6.3</strong> The Deposit will only be repaid at the end of the tenancy when the conditions in clause 1.7.5 and sub-clauses of the tenancy agreement have been completed and the Landlord and Tenant have agreed, or a dispute has been adjudicated by the alternative dispute resolution service, or on the order of a court.</p>
<p class="clause"><strong>6.4</strong> If either party is not contactable at the end of the tenancy, then the other party should seek advice from the deposit scheme provider at the above contact details.</p>
<p class="clause"><strong>6.5</strong> If the Landlord and Tenant do not agree with each other about the amount of the Deposit refund at the end of the tenancy they may either apply to the scheme for the free alternative dispute resolution service or seek a county court order for a judgement on their claim.</p>
<p class="clause"><strong>6.6</strong> The scheme offers free dispute resolution for deposits it covers. Please see its website for details of how and when to apply.</p>
<p class="clause"><strong>6.7</strong> The Deposit value is as per clause 1.7.1.</p>
<p class="clause"><strong>6.8</strong> The address of the Property is as per clause 1.5.</p>
<p class="clause"><strong>6.9</strong> The contact details of the Landlord are as per clause 1.1.1.</p>
<p class="clause"><strong>6.10</strong> The contact details of the Tenant are as per clause 1.1.2.</p>
<p class="clause"><strong>6.11</strong> Information about any Relevant Person is in clause 1.1.4.</p>
<p class="clause"><strong>6.12</strong> The reasons for possible deductions from the Deposit are listed in clause 1.7 and sub-clauses 1.7.4 and 1.7.5.</p>
<p class="clause"><strong>6.13</strong> The Lead Tenant for this tenancy will be {{lead_tenant_name}}. The parties forming the Tenant declare that the Lead Tenant should represent all of them in any decisions regarding the Deposit and that the decision of the Lead Tenant will be binding on all the parties forming the Tenant in this tenancy agreement, subject to the rules of the scheme.</p>

<!-- ================================================================ -->
<!-- Section 7 - Housing Benefit                                        -->
<!-- ================================================================ -->

<h2>7. Housing Benefit</h2>
<p class="clause"><strong>7.1</strong> The Tenant agrees that the appropriate authority may discuss with the Landlord and the Landlord's Agent the details of any housing benefit, council tax or universal credit claims made at any time in relation to the renting of the Property.</p>
<p class="clause"><strong>7.2</strong> If the Landlord or Landlord's Agent so requires and the rules allow it, the Tenant consents to any benefit being paid directly to the Principal Contact.</p>
<p class="clause"><strong>7.3</strong> The Tenant agrees to refund to the Principal Contact any benefit overpayment recovery which is sought from the Landlord or the Landlord's Agent in respect of this tenancy, either before or after the Tenant has vacated the Property, where this creates a shortfall in the money owed to the Landlord or the Landlord's Agent.</p>

<!-- ================================================================ -->
<!-- Signatures                                                        -->
<!-- ================================================================ -->

<h2>Signatures</h2>

<p>The Landlord or the Landlord's Agent sign this tenancy agreement to confirm acceptance of the terms within it and in accordance with article 2(1)(g)(vii), The Housing (Tenancy Deposits) (Prescribed Information) Order 2007, the Landlord certifies that the information provided about the Tenancy Deposit Protection prescribed information is accurate to the best of their knowledge and belief; and that the Tenant has had the opportunity to sign this document containing the information provided by the Landlord, by way of confirmation that the information is accurate to the best of the Tenant's knowledge and belief.</p>

<p><strong>SIGNATURE OF LANDLORD</strong></p>
<p>[SIGNATURE:agent]</p>

<p><strong>The Tenant is advised to ensure they have read and understood this tenancy agreement before signing it.</strong></p>

<p>The Tenant signs this tenancy agreement to confirm acceptance of the terms within it and in accordance with article 2(1)(g)(vii)(bb), The Housing (Tenancy Deposits) (Prescribed Information) Order 2007, the Tenant confirms that the information provided for the Tenancy Deposit Protection prescribed information is accurate to the best of their knowledge and belief.</p>

<p><strong>Signed by Landlord / Letting Agent:</strong></p>
<p>[SIGNATURE:agent]</p>

<p><strong>Signed by Tenant:</strong></p>
<p>[SIGNATURE:tenant]</p>

</div>$body$
WHERE key = 'default_ast';
