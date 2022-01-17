// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Gender } from "@pestras/stores-sales-core/common";
import { Validall } from "@pestras/validall";

export enum CommonValidators {
  GEOLOCATION = 'GeoLocation',
  CONTACTS_DETAILS = 'ContactsDetails',
  ADDRESS = 'Address',
  PROFILE = 'Profile'
}

new Validall(CommonValidators.GEOLOCATION, {
  lat: { $type: 'string', $is: 'number', $message: 'invalidLatitude' },
  lng: { $type: 'string', $is: 'number', $message: 'invalidLongitude' }
});

new Validall(CommonValidators.ADDRESS, {
  country: { $type: 'string', $default: '', $message: 'invalidCountry' },
  state: { $type: 'string', $default: '', $message: 'invalidState' },
  city: { $type: 'string', $default: '', $message: 'invalidCity' },
  street: { $type: 'string', $default: '', $message: 'invalidStreet' },
  details: { $type: 'string', $default: '', $message: 'invalidAddressDetails' },
  loaction: { $ref: CommonValidators.GEOLOCATION }
});

new Validall(CommonValidators.CONTACTS_DETAILS, {
  mob: { $type: 'string', $is: 'number', $message: 'invalidMobNumber' },
  tel: { $type: 'string', $is: 'number', $message: 'invalidTelNumber' },
  email: { $type: 'string', $is: 'email', $default: '', $message: 'invalidEmail' }
});

new Validall(CommonValidators.PROFILE, {
  name: { $type: 'string', $required: true, $message: 'invalidName' },
  gender: { $type: 'number', $enum: [Gender.MALE, Gender.FEMALE], $default: 0, $message: 'invalidGender' },
  contacts: { $ref: CommonValidators.CONTACTS_DETAILS }
});