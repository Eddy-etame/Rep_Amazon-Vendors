import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceProduitVendeur } from '../../core/services/service-produit-vendeur';
import { ServiceNotification } from '../../core/services/service-notification';
import { Product, ProductStatus } from '../../core/models/modele-produit';

@Component({
  selector: 'app-formulaire-produit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './formulaire-produit.html',
  styleUrls: ['./formulaire-produit.scss']
})
export class FormulaireProduit implements OnInit {
  form!: FormGroup;
  productId: string | null = null;
  isEditMode = false;
  submitted = false;
  imagePreview: string | null = null;
  loading = false;
  readonly statusOptions: ProductStatus[] = ['published', 'draft', 'archived'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private vendorProductService: ServiceProduitVendeur,
    private notificationService: ServiceNotification,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.route.params.subscribe((params) => {
      const rawId = params['id'];
      if (rawId) {
        this.productId = String(rawId);
        this.isEditMode = true;
        void this.loadProduct(this.productId);
      }
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      sku: [''],
      name: ['', [Validators.required]],
      price: [null, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      lowStockThreshold: [5, [Validators.required, Validators.min(0)]],
      category: ['', [Validators.required]],
      status: ['published', [Validators.required]],
      image: [''],
      gallery: [''],
      description: ['']
    });
  }

  private async loadProduct(id: string): Promise<void> {
    this.loading = true;
    try {
      await this.vendorProductService.loadAll();
      let p = this.vendorProductService.getById(id);
      if (!p) {
        p = await this.vendorProductService.fetchOne(id);
      }
      if (!p) {
        this.notificationService.error('Produit introuvable');
        await this.router.navigate(['/vendeur/produits']);
        return;
      }
      this.form.patchValue({
        sku: p.sku,
        name: p.name,
        price: p.price,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        category: p.category,
        status: p.status,
        image: p.image ?? '',
        gallery: (p.gallery ?? []).join('\n'),
        description: p.description ?? ''
      });
      this.imagePreview = p.image ?? null;
    } finally {
      this.loading = false;
      this.syncView();
    }
  }

  get f() {
    return this.form.controls;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.error("L'image doit faire moins de 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      this.imagePreview = base64;
      this.form.patchValue({ image: base64 });
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.imagePreview = null;
    this.form.patchValue({ image: '' });
  }

  applyImageUrl(): void {
    const url = String(this.f['image'].value ?? '').trim();
    this.imagePreview = url || null;
  }

  private parseGallery(raw: string): string[] {
    if (!raw.trim()) {
      return [];
    }
    return [...new Set(raw.split(/\r?\n|,/).map((v) => v.trim()).filter(Boolean))];
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    if (this.form.invalid) return;

    const gallery = this.parseGallery(String(this.f['gallery'].value || ''));
    const payload = {
      sku: String(this.f['sku'].value || '').trim(),
      name: String(this.f['name'].value).trim(),
      price: Number(this.f['price'].value),
      stock: Number(this.f['stock'].value),
      lowStockThreshold: Number(this.f['lowStockThreshold'].value),
      category: String(this.f['category'].value).trim(),
      status: String(this.f['status'].value || 'published') as ProductStatus,
      image: (this.f['image'].value || '').trim(),
      gallery,
      description: (this.f['description'].value || '').trim()
    } as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

    try {
      if (this.isEditMode && this.productId !== null) {
        await this.vendorProductService.update(this.productId, payload);
        this.notificationService.success('Produit modifié avec succès');
      } else {
        await this.vendorProductService.create(payload);
        this.notificationService.success('Produit ajouté avec succès');
      }
      await this.router.navigate(['/vendeur/produits']);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur';
      if (msg.includes('VENDOR_PENDING') || msg.includes('approbation')) {
        this.notificationService.error('Compte en attente d\'approbation : publication impossible pour l\'instant.');
        return;
      }
      if (msg.includes('VENDOR_REJECTED')) {
        this.notificationService.error('Compte vendeur refusé.');
        return;
      }
      this.notificationService.error(msg);
    }
  }

  onCancel(): void {
    void this.router.navigate(['/vendeur/produits']);
  }

  private syncView(): void {
    this.cdr.detectChanges();
  }
}
