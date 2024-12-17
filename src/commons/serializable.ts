/**
 * A base class that provides a custom JSON serialization method.
 *
 * @remarks
 * The Serializable class offers a simple mechanism for converting class instances
 * to JSON representation using a shallow copy of the instance's properties.
 **/
export class Serializable {
    toJSON() {
        // Use Object.assign to return a shallow copy of the instance, excluding certain properties
       return { ...this};
    }
}