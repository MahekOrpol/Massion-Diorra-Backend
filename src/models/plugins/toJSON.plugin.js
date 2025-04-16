/* eslint-disable no-param-reassign */

/**
 * A mongoose schema plugin which applies the following in the toJSON transform call:
 *  - removes __v, createdAt, updatedAt, and any path that has private: true
 *  - replaces _id with id
 */

const deleteAtPath = (obj, path, index) => {
  if (index === path.length - 1) {
    delete obj[path[index]];
    return;
  }
  deleteAtPath(obj[path[index]], path, index + 1);
};

const toJSON = (schema) => {
  let transform;
  if (schema.options.toJSON && schema.options.toJSON.transform) {
    transform = schema.options.toJSON.transform;
  }

  schema.options.toJSON = Object.assign(schema.options.toJSON || {}, {
    transform(doc, ret, options) {
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      } else {
        console.error("toJSON Error: _id is undefined!", ret);
      }

      delete ret.__v;
      delete ret.updatedAt;

      if (transform) {
        return transform(doc, ret, options);
      }
    },
  });
};

module.exports = toJSON;


