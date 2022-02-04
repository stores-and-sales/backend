// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Validall } from '@pestras/validall';

export enum ProductsValidators {
  CREATE = 'CreateProduct',
  UPDATE = 'UpdateProduct',
  ADD_IMAGE = 'AddProductImage',
  DELETE_IMAGE = 'DeleteProductImage',
  ADD_PROPERTY = 'AddProductProperty',
  UPDATE_PROPERTY = 'UpdateProductProperty'
}

new Validall(ProductsValidators.CREATE, {
  name: { $type: 'string', $required: true, $message: 'invalidProductName' },
  description: { $type: 'string', $default: '', $message: 'invalidProductDescription' },
  price: { $type: 'number', $required: true, $message: 'invalidProductPrice' },
  tags: { $default: [], $each: { $type: 'string', $message: 'invalidProductTag' } }
});

new Validall(ProductsValidators.UPDATE, {
  $ref: ProductsValidators.CREATE
});

new Validall(ProductsValidators.ADD_IMAGE, {
  src: { $type: 'string', $required: true, $message: 'invalidProductImageSrc' }
});

new Validall(ProductsValidators.DELETE_IMAGE, {
  src: { $type: 'string', $required: true, $message: 'invalidProductImageSrc' }
});

new Validall(ProductsValidators.ADD_PROPERTY, {
  name: { $type: 'string', $required: true, $message: 'invalidProductPropertyName' },
  value: { $type: 'string', $required: true, $message: 'invalidProductPropertyValue' }
});

new Validall(ProductsValidators.UPDATE_PROPERTY, {
  name: { $type: 'string', $required: true, $message: 'invalidProductPropertyName' },
  value: { $type: 'string', $required: true, $message: 'invalidProductPropertyValue' }
});