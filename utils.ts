import type { Collection } from "mongodb";
import type { Person } from "./types.ts";
import type { PersonModel } from "./types.ts";

export const fromModelToPerson = async (personModel:PersonModel, friendCollection:Collection<PersonModel>) : Promise<Person> => {

    const amigos = await friendCollection.find({_id: {$in: personModel.amigos}}).toArray();

    return {
        id: personModel._id!.toString(),
        name: personModel.name,
        email: personModel.email,
        telefono: personModel.telefono,
        amigos: amigos.map((pm:PersonModel) => fromModelToPerson(pm,friendCollection)),
    }

}
