import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VendorProductService } from '../../core/services/vendor-product.service';
import { NotificationService } from '../../core/services/notification.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit {
  form!: FormGroup;
  productId: number | null = null;
  isEditMode = false;
  submitted = false;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private vendorProductService: VendorProductService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.productId = Number(params['id']);
        this.isEditMode = true;
        this.loadProduct(this.productId);
      }
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      price: [null, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      category: ['', [Validators.required]],
      image: [''],
      description: ['']
    });
  }

  private loadProduct(id: number): void {
    const p = this.vendorProductService.getById(id);
    if (!p) {
      this.router.navigate(['/seller/products']);
      return;
    }
    this.form.patchValue({
      name: p.name,
      price: p.price,
      stock: p.stock,
      category: p.category,
      image: p.image ?? '',
      description: p.description ?? ''
    });
    this.imagePreview = p.image ?? null;
  }

  get f() {
    return this.form.controls;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.error('L\'image doit faire moins de 5MB');
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

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    const payload = {
      name: String(this.f['name'].value).trim(),
      price: Number(this.f['price'].value),
      stock: Number(this.f['stock'].value),
      category: String(this.f['category'].value).trim(),
      image: (this.f['image'].value || '').trim(),
      description: (this.f['description'].value || '').trim()
    } as Omit<Product, 'id'>;

    if (this.isEditMode && this.productId !== null) {
      this.vendorProductService.update(this.productId, payload);
      this.notificationService.success('Produit modifié avec succès');
    } else {
      this.vendorProductService.create(payload);
      this.notificationService.success('Produit ajouté avec succès');
    }

    this.router.navigate(['/seller/products']);
  }

  onCancel(): void {
    this.router.navigate(['/seller/products']);
  }
}
