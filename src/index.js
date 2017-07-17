String.prototype.toUnderscore = function(){
  return this.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();});
};

class BookshelfType {
  static collection (aCollection) {
    return Promise.resolve(aCollection).then((c) => c.models);
  }

  belongsTo (options) {
    options.resolve = (modelInstance, params, context, info) => {
      const relation =  modelInstance.related(info.fieldName) !== undefined ? modelInstance.related(info.fieldName) : modelInstance.related(info.fieldName.toUnderscore());
      return relation.fetch();
    };
    return options;
  }

  hasMany (options) {
    let passBuilder = options.resolve;
    const isConnection = options.type.constructor.name != 'GraphQLList'
    options.resolve = (modelInstance, params, context, info) => {
      let passFn;
      if (passBuilder)
        passFn = function(qb) { passBuilder(qb, modelInstance, params, context, info) };
      let fieldName = modelInstance.get(info.fieldName) !== undefined ? info.fieldName : info.fieldName.toUnderscore();
      let loadOptions = {};
      loadOptions[fieldName] = passFn;
      return modelInstance.clone().load(loadOptions).then(
        (model) => {
          return this.constructor.collection( model.related(fieldName) ).then((models) => {
            if (isConnection) {
              return require('graphql-relay').connectionFromArray(models, options.args);
            } else {
              return models;
            }
          })
        }
      );
    };
    return options;
  }

  attr (options) {
    options.resolve = (modelInstance, params, context, info) => {
      const property = modelInstance.get(info.fieldName) !== undefined ? modelInstance.get(info.fieldName) : modelInstance.get(info.fieldName.toUnderscore());
      return property;
    }
    return options;
  }
}

export default function BookshelfWrapper(config) {
  let fields = config.fields;
  let ref = new BookshelfType();
  config.fields = (() => fields.call(ref, ref));
  return config;
}
BookshelfWrapper.collection = BookshelfType.collection;
