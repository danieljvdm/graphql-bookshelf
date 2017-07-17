'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = BookshelfWrapper;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

String.prototype.toUnderscore = function () {
  return this.replace(/([A-Z])/g, function ($1) {
    return "_" + $1.toLowerCase();
  });
};

var BookshelfType = function () {
  function BookshelfType() {
    _classCallCheck(this, BookshelfType);
  }

  _createClass(BookshelfType, [{
    key: 'belongsTo',
    value: function belongsTo(options) {
      options.resolve = function (modelInstance, params, context, info) {
        const relation =  modelInstance.related(info.fieldName) ||  modelInstance.related(info.fieldName.toUnderscore());
        return relation.fetch();
      };
      return options;
    }
  }, {
    key: 'hasMany',
    value: function hasMany(options) {
      var _this = this;

      var passBuilder = options.resolve;
      var isConnection = options.type.constructor.name != 'GraphQLList';
      options.resolve = function (modelInstance, params, context, info) {
        var passFn = void 0;
        if (passBuilder) passFn = function passFn(qb) {
          passBuilder(qb, modelInstance, params, context, info);
        };
        var fieldName = modelInstance.get(info.fieldName) ? info.fieldName : info.fieldName.toUnderscore();
        var loadOptions = {};
        loadOptions[fieldName] = passFn;
        return modelInstance.clone().load(loadOptions).then(function (model) {
          return _this.constructor.collection(model.related(fieldName)).then(function (models) {
            if (isConnection) {
              return require('graphql-relay').connectionFromArray(models, options.args);
            } else {
              return models;
            }
          });
        });
      };
      return options;
    }
  }, {
    key: 'attr',
    value: function attr(options) {
      options.resolve = function (modelInstance, params, context, info) {
        const property = modelInstance.get(info.fieldName) || modelInstance.get(info.fieldName.toUnderscore());
        return property;
      };
      return options;
    }
  }], [{
    key: 'collection',
    value: function collection(aCollection) {
      return Promise.resolve(aCollection).then(function (c) {
        return c.models;
      });
    }
  }]);

  return BookshelfType;
}();

function BookshelfWrapper(config) {
  var fields = config.fields;
  var ref = new BookshelfType();
  config.fields = function () {
    return fields.call(ref, ref);
  };
  return config;
}
BookshelfWrapper.collection = BookshelfType.collection;

