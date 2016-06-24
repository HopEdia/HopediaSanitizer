'use strict';
const mongo_uuid = require('mongodb').ObjectID,
      mongo_sanitize = require('mongo-sanitize');

//Thx http://stackoverflow.com/a/24190282/5728258
function delete_null_properties(test, recurse) {
	for (var i in test) {
		if (test[i] === null || test[i] === undefined)
			delete test[i];
		else if (recurse && typeof test[i] === 'object') {
			delete_null_properties(test[i], recurse);
		}
	}
	return test;
}
exports.delete_null_properties = delete_null_properties;

//source: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/BarcodeFormat.java,
//REGEX: (),\n.*\n*\n.*\n  (); ',\1\2'
const ACCEPTED_CODE = ['AZTEC','CODABAR','CODE_39','CODE_93','CODE_128','DATA_MATRIX','EAN_8','EAN_13','ITF','MAXICODE','PDF_417','QR_CODE','RSS_14','RSS_EXPANDED','UPC_A','UPC_E','UPC_EAN_EXTENSION'];

function uid(uid) {
	if(uid)
		return mongo_uuid(uid)
	else
		return;
}
function insertDateAndUser(value, insert, user_id) {
	if(value && insert)
		return {
			'_value' : value,
			'user': mongo_uuid(user_id),
			'date': new Date().toJSON()
		}
	else if(value)
		return value;
	else
		return;
}
function validateType(value, type) {
	if(typeof value === type) {
		return mongo_sanitize(value);
	}
	else if(typeof value[0] === 'object') {
		if(value[0] === null) {
			return;
		}
		if(typeof value[0]._value === type)
			return mongo_sanitize(value[0]._value);
		else
			return;
	}
}

exports.beer = {
	'id': (id) => {
		if(!id)
			return;
		else
			return mongo_uuid(id);
	},
	'name': (name, insert, user) => {
		if(name) {
			return insertDateAndUser(validateType(name, 'string'), insert, user);
		}
		else
			return;
	},
	'brewery_id': (brewery_id, insert, user) => {
		if(brewery_id)
			return insertDateAndUser(mongo_uuid(validateType(brewery_id, 'string')), insert, user);
		else
			return;
	},
	'abv': (abv, insert, user) => {
		if(abv) {
			abv=validateType(abv, 'number')
			if(abv >= 0 && abv <= 100) {
				return insertDateAndUser(abv, insert, user);
			}
			else
				return;
		}
		else
			return;
	},
	'ibu': (ibu, insert, user) => {
		if(ibu)
			return insertDateAndUser(validateType(ibu, 'number'), insert, user);
		else
			return;
	},
	'wikidata_id': (wikidata_id, insert, user) => {
		if(wikidata_id) {
			if(wikidata_id[0] === 'Q')
				return insertDateAndUser(validateType(wikidata_id, 'string'), insert, user);
			else
				return;
		}
		else
			return;
	},
	'category': (cat, insert, user) => {
		//TODO ??
		//loop before check if array
		if(cat)
			return insertDateAndUser(validateType(cat, 'string'), insert, user);
		else
			return;
	},
	'barcode': (barcode, insert, user) => {
		if(barcode) {
			if(Array.isArray(barcode))
				barcode = barcode[0]
			if(barcode._value && barcode.format){
				if(ACCEPTED_CODE.indexOf(barcode.format) !== -1) {
					var result = insertDateAndUser(validateType(barcode._value, 'string'), insert, user);
					result.format = barcode.format;
					return result;
				}
				else
					return;
			}
		}
		else
			return;
	},
	'packaging': (type) => {
		if(!['bottle', 'can', 'draft'].indexOf(type))
			return;
		else
			return type
	},
	//reviews
	'shop': (shop) => {
		//check shop
		return uid(shop);
	},
	'ebc': (ebc) => {
		if(ebc >= 0 && ebc <= 100)
			return Number(ebc)
		else
			return;
	},
	'scentOrTaste': (scentOrTaste) => {
		if(scentOrTaste) {
			var count = 0, result = {};
			if(scentOrTaste.sweet >= 0 && scentOrTaste.sweet <= 100)
				result.sweet = Number(scentOrTaste.sweet); count += 1;
			if(scentOrTaste.bitter >= 0 && scentOrTaste.bitter <= 100)
				result.bitter = Number(scentOrTaste.bitter); count +=1;
			if(scentOrTaste.acid >= 0 && scentOrTaste.acid <= 100)
				result.acid = Number(scentOrTaste.acid); count +=1;
			if(scentOrTaste.alcohol >= 0 && scentOrTaste.alcohol <= 100)
				result.alcohol = Number(scentOrTaste.alcohol); count +=1;
			if(scentOrTaste.fruit >= 0 && scentOrTaste.fruit <= 100)
				result.fruit = Number(scentOrTaste.fruit); count +=1;
			if(scentOrTaste.other >= 0 && scentOrTaste.other <= 100)
				result.other = Number(scentOrTaste.other); count +=1;
		}
		else {
			return;
		}
		if(count > 0) {
			return result;
		}
		else {
			return;
		}
	},
	'remark': (remark) => {
		if(remark.lang && remark._value) {
			if(remark.lang.length == 2 && remark._value.length < 300 ) {
				return {
					'lang': mongo_sanitize(String(remark.lang)),
					'_value' : mongo_sanitize(String(remark._value))
				}
			}
			else
				return;
		}
		else
			return;
	},
	'rate': (rate) => {
		if(rate >= 1 && rate <= 10)
			return Number(rate)
		else
			return;
	}

}
