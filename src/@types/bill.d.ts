export interface Bill {
	_id: Id;
	batch_id: string;
	billed: boolean;
	name: string;
	rif: string;
	document: Document;
	document_url: string;
	error: unknown;
	file_name: string;
	oriented_to: string;
	concept: string;
	product: string;
	system_reference: SystemReference;
	third_party: boolean;
	total: number;
	created_at: CreatedAt;
	updated_at: UpdatedAt;
	number: number;
}

interface Id {
	$oid: string;
}

interface Document {
	address: string;
	amount_letters: string;
	amount_letters_ves: string;
	bcv_message: string;
	conversion_currency: string;
	credit_note_text: string;
	currency: string;
	details: Array<Detail>;
	document_type: string;
	email_cc: string;
	email_to: string;
	emission_date_and_time: string;
	exchange_rate: number;
	exempt_amount: number;
	exempt_amount_third: number;
	exempt_amount_third_ves: number;
	exempt_amount_ves: number;
	extra: Extra;
	fiscal_registry: string;
	grand_total: number;
	grand_total_ves: number;
	igtf_amount: number;
	igtf_amount_ves: number;
	igtf_base_amount: number;
	igtf_base_amount_ves: number;
	igtf_percentage: number;
	is_third: boolean;
	name: string;
	note1: string;
	note2: string;
	note3: string;
	number: number;
	payment_type: string;
	phone: string;
	system_reference: string;
	tax_amount: number;
	tax_amount_third: number;
	tax_amount_third_ves: number;
	tax_amount_ves: number;
	tax_base: number;
	tax_base_third: number;
	tax_base_third_ves: number;
	tax_base_ves: number;
	tax_percent: number;
	tax_percent_third: number;
	tax_percent_third_ves: number;
	tax_percent_ves: number;
	template_name: string;
	total: number;
	total_third: number;
	total_third_ves: number;
	total_ves: number;
}

interface Detail {
	amount: number;
	description: string;
	fiscal_registry_third: string;
	is_exempt: boolean;
	name_third: string;
	operation_code: string;
	quantity: number;
	tax_amount: number;
	tax_percent: number;
	unit_price: number;
}

interface Extra {
	costcenter: string;
}

interface SystemReference {
	$numberLong: string;
}

interface CreatedAt {
	$date: string;
}

interface UpdatedAt {
	$date: string;
}
