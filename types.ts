import { ObjectId, type OptionalId } from "mongodb";

export type PersonModel = OptionalId<{
    name:string,
    email: string,
    telefono: number,
    amigos: ObjectId[],
}>

export type Person = {
    id: string,
    name:string,
    email: string,
    telefono: number,
    amigos: Promise<Person>[],
}