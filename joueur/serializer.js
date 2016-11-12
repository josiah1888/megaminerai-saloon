// Serializer: functions to serialize and unserialize json communications strings
var Class = require("classe");
var BaseGameObject = require("./baseGameObject");

Serializer = {
    isEmpty: function(obj){
        return (Object.getOwnPropertyNames(obj).length === 0);
    },

    isEmptyExceptFor: function(obj, key) {
        return (Serializer.isObject(obj) && Object.getOwnPropertyNames(obj).length === 1 && obj[key] !== undefined);
    },

    isGameObjectReference: function(obj) {
        return Serializer.isEmptyExceptFor(obj, 'id');
    },

    isObject: function(obj) {
        return (typeof(obj) === 'object' && obj !== null);
    },

    isSerializable: function(obj, key) {
        return Serializer.isObject(obj) && obj.hasOwnProperty(key) && !String(key).startsWith("_");
    },

    serialize: function(data) {
        if(!Serializer.isObject(data)) { // then no need to serialize it, it's already json serializable as a string, number, boolean, null, etc.
            return data;
        }

        if(Class.isInstance(data, BaseGameObject)) { // no need to serialize this whole thing, send an object reference
            return { id: data.id };
        }

        var serialized = data.isArray ? [] : {};
        for(var key in data) {
            if(Serializer.isSerializable(data, key)) {
                serialized[key] = Serializer.serialize(data[key]);
            }
        }
        return serialized;
    },

    deserialize: function(data, game) {
        if(Serializer.isObject(data)) {
            var result = data.isArray ? [] : {};

            for(var key in data) {
                var value = data[key];
                if(typeof(value) == "object") {
                    if(Serializer.isGameObjectReference(value)) { // it's a tracked game object
                        result[key] = game.getGameObject(value.id);
                    }
                    else {
                        result[key] = Serializer.deserialize(value);
                    }
                }
                else {
                    result[key] = value;
                }
            }

            return result;
        }

        return data;
    },
};

module.exports = Serializer;
