from django.db import models, transaction
from django.core.exceptions import ValidationError


class PosTenantModel(models.Model):
    organization_id = models.CharField(max_length=64, db_index=True)
    school_id = models.CharField(max_length=64, db_index=True)
    campus_id = models.CharField(max_length=64, blank=True, default="", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class POSCategory(PosTenantModel):
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50)
    description = models.TextField(blank=True, default="")
    default_gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "pos_categories"
        unique_together = ("school_id", "code")


class POSBrand(PosTenantModel):
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50)
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "pos_brands"
        unique_together = ("school_id", "code")


class POSProduct(PosTenantModel):
    category = models.ForeignKey(POSCategory, on_delete=models.PROTECT, related_name="products")
    brand = models.ForeignKey(POSBrand, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=80)
    barcode = models.CharField(max_length=120)
    description = models.TextField(blank=True, default="")
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    unit = models.CharField(max_length=32, default="pcs")
    opening_stock = models.IntegerField(default=0)
    current_stock = models.IntegerField(default=0)
    min_stock_level = models.IntegerField(default=5)
    image_url = models.URLField(max_length=500, blank=True, default="")
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pos_products"
        unique_together = (("school_id", "barcode"), ("school_id", "sku"))


class POSBarcode(PosTenantModel):
    product = models.ForeignKey(POSProduct, on_delete=models.CASCADE, related_name="barcodes")
    barcode = models.CharField(max_length=120)
    format = models.CharField(max_length=16, default="CODE128")

    class Meta:
        db_table = "pos_barcodes"
        unique_together = ("school_id", "barcode")


class POSCustomer(PosTenantModel):
    name = models.CharField(max_length=180)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True, default="")
    address = models.TextField(blank=True, default="")
    gstin = models.CharField(max_length=32, blank=True, default="")
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "pos_customers"


class POSSupplier(PosTenantModel):
    name = models.CharField(max_length=180)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True, default="")
    address = models.TextField(blank=True, default="")
    gstin = models.CharField(max_length=32, blank=True, default="")
    payment_terms = models.CharField(max_length=120, default="Net 15 Days")
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "pos_suppliers"


class POSCounter(PosTenantModel):
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=40)
    location = models.CharField(max_length=160, blank=True, default="")
    assigned_cashier_ids = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "pos_counters"
        unique_together = ("school_id", "campus_id", "code")


class POSCashRegister(PosTenantModel):
    counter = models.ForeignKey(POSCounter, on_delete=models.PROTECT)
    register_no = models.CharField(max_length=64)
    cashier_id = models.CharField(max_length=64)
    cashier_name = models.CharField(max_length=160)
    opening_time = models.DateTimeField()
    closing_time = models.DateTimeField(null=True, blank=True)
    opening_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cash_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cash_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cash_refunds = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    expected_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    actual_cash = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cash_difference = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, default="Open")
    closed_by = models.CharField(max_length=64, blank=True, default="")
    approved_by = models.CharField(max_length=64, blank=True, default="")
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "pos_cash_registers"


class POSCashRegisterTransaction(models.Model):
    register = models.ForeignKey(POSCashRegister, on_delete=models.CASCADE, related_name="transactions")
    type = models.CharField(max_length=32)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference_no = models.CharField(max_length=80, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    recorded_by = models.CharField(max_length=120)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "pos_cash_register_transactions"


class POSDiscount(PosTenantModel):
    code = models.CharField(max_length=60)
    name = models.CharField(max_length=150)
    type = models.CharField(max_length=20, default="PERCENTAGE")
    value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_bill_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    max_discount_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valid_from = models.DateField(null=True, blank=True)
    valid_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "pos_discounts"
        unique_together = ("school_id", "code")


class POSSale(PosTenantModel):
    counter_id = models.CharField(max_length=64, blank=True, default="")
    register_id = models.CharField(max_length=64, blank=True, default="")
    invoice_no = models.CharField(max_length=80)
    sale_date = models.DateTimeField()
    status = models.CharField(max_length=30, default="Completed")
    customer = models.ForeignKey(POSCustomer, on_delete=models.SET_NULL, null=True, blank=True)
    customer_name = models.CharField(max_length=180, default="Walk-in Customer")
    cashier_id = models.CharField(max_length=64)
    cashier_name = models.CharField(max_length=160)
    tax_mode = models.CharField(max_length=20, default="INTRA_STATE")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    item_discount_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bill_discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cgst_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sgst_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    igst_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    additional_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_received = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    change_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=30, default="Cash")
    accounting_posted = models.BooleanField(default=False)

    class Meta:
        db_table = "pos_sales"
        unique_together = ("school_id", "invoice_no")


class POSSaleItem(models.Model):
    sale = models.ForeignKey(POSSale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(POSProduct, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=200)
    sku = models.CharField(max_length=80)
    barcode = models.CharField(max_length=120)
    quantity = models.PositiveIntegerField()
    returned_qty = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = "pos_sale_items"


class POSPayment(PosTenantModel):
    reference_type = models.CharField(max_length=32)
    reference_id = models.CharField(max_length=64)
    reference_no = models.CharField(max_length=80)
    party_name = models.CharField(max_length=180)
    method = models.CharField(max_length=30)
    direction = models.CharField(max_length=10)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_ref = models.CharField(max_length=120, blank=True, default="")
    recorded_by = models.CharField(max_length=120)
    payment_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "pos_payments"


class POSSaleReturn(PosTenantModel):
    return_no = models.CharField(max_length=80)
    sale = models.ForeignKey(POSSale, on_delete=models.PROTECT, related_name="returns")
    original_invoice_no = models.CharField(max_length=80)
    customer_name = models.CharField(max_length=180)
    return_date = models.DateTimeField()
    total_refund_amount = models.DecimalField(max_digits=12, decimal_places=2)
    refund_method = models.CharField(max_length=30, default="Cash")
    reason = models.TextField()
    status = models.CharField(max_length=30, default="Pending Approval")
    requested_by = models.CharField(max_length=120)
    approved_by = models.CharField(max_length=120, blank=True, default="")
    approved_at = models.DateTimeField(null=True, blank=True)
    accounting_posted = models.BooleanField(default=False)

    class Meta:
        db_table = "pos_sale_returns"
        unique_together = ("school_id", "return_no")


class POSPurchase(PosTenantModel):
    purchase_no = models.CharField(max_length=80)
    supplier = models.ForeignKey(POSSupplier, on_delete=models.PROTECT, related_name="purchases")
    supplier_name = models.CharField(max_length=180)
    supplier_invoice_no = models.CharField(max_length=80)
    purchase_date = models.DateField()
    purchase_type = models.CharField(max_length=20, default="Cash")
    payment_status = models.CharField(max_length=20, default="Paid")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    recorded_by = models.CharField(max_length=120)
    accounting_posted = models.BooleanField(default=False)

    class Meta:
        db_table = "pos_purchases"
        unique_together = ("school_id", "purchase_no")


class POSPurchaseItem(models.Model):
    purchase = models.ForeignKey(POSPurchase, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(POSProduct, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=200)
    sku = models.CharField(max_length=80)
    quantity = models.PositiveIntegerField()
    returned_qty = models.PositiveIntegerField(default=0)
    purchase_rate = models.DecimalField(max_digits=12, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = "pos_purchase_items"


class POSStockMovement(PosTenantModel):
    product = models.ForeignKey(POSProduct, on_delete=models.PROTECT, related_name="movements")
    movement_type = models.CharField(max_length=32)
    quantity_change = models.IntegerField()
    previous_stock = models.IntegerField()
    new_stock = models.IntegerField()
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    valuation_delta = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    reference_type = models.CharField(max_length=50, blank=True, default="")
    reference_no = models.CharField(max_length=80, blank=True, default="")
    reason = models.TextField(blank=True, default="")
    recorded_by = models.CharField(max_length=120)

    class Meta:
        db_table = "pos_stock_movements"

    @classmethod
    @transaction.atomic
    def apply_stock_change(
        cls,
        product: POSProduct,
        quantity_change: int,
        movement_type: str,
        recorded_by: str,
        allow_negative: bool = False,
        reference_type: str = "",
        reference_no: str = "",
        reason: str = "",
    ):
        locked = POSProduct.objects.select_for_update().get(pk=product.pk)
        prev_stock = locked.current_stock
        next_stock = prev_stock + quantity_change
        if next_stock < 0 and not allow_negative:
            raise ValidationError(f"Insufficient stock for {locked.name} (available: {prev_stock}).")
        locked.current_stock = next_stock
        locked.save(update_fields=["current_stock", "updated_at"])
        return cls.objects.create(
            organization_id=locked.organization_id,
            school_id=locked.school_id,
            campus_id=locked.campus_id,
            product=locked,
            movement_type=movement_type,
            quantity_change=quantity_change,
            previous_stock=prev_stock,
            new_stock=next_stock,
            unit_cost=locked.purchase_price,
            valuation_delta=locked.purchase_price * quantity_change,
            reference_type=reference_type,
            reference_no=reference_no,
            reason=reason,
            recorded_by=recorded_by,
        )


class POSExpense(PosTenantModel):
    expense_no = models.CharField(max_length=80)
    expense_date = models.DateField()
    category = models.CharField(max_length=120)
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=30, default="Cash")
    register_id = models.CharField(max_length=64, blank=True, default="")
    recorded_by = models.CharField(max_length=120)
    accounting_posted = models.BooleanField(default=False)

    class Meta:
        db_table = "pos_expenses"


class POSSettings(PosTenantModel):
    business_name = models.CharField(max_length=200, blank=True, default="")
    business_address = models.TextField(blank=True, default="")
    business_phone = models.CharField(max_length=40, blank=True, default="")
    business_email = models.EmailField(blank=True, default="")
    gstin = models.CharField(max_length=32, blank=True, default="")
    invoice_prefix = models.CharField(max_length=24, default="POS")
    default_tax_mode = models.CharField(max_length=20, default="INTRA_STATE")
    tax_rates = models.JSONField(default=list)
    default_invoice_format = models.CharField(max_length=10, default="80mm")
    allow_negative_stock_override = models.BooleanField(default=False)
    allow_credit_sales = models.BooleanField(default=True)
    require_return_approval = models.BooleanField(default=True)
    auto_post_to_accounting = models.BooleanField(default=True)
    invoice_footer_note = models.CharField(max_length=300, blank=True, default="")
    currency_symbol = models.CharField(max_length=8, default="₹")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pos_settings"
