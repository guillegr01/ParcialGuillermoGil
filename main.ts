import { MongoClient, ObjectId } from "mongodb";
import type { PersonModel } from "./types.ts";
import { fromModelToPerson } from "./utils.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");

if(!MONGO_URL) {
  console.error("MONGO_URL not found");
  Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Conected succesfully to server");

const db = client.db("BBDDpersoas");
const PersonCollection = db.collection<PersonModel>("person");

const handler = async (req:Request) : Promise<Response> => {

  const method = req.method;
  const url = new URL(req.url);

  const path = url.pathname;
  const searchParams = url.searchParams;

  if (method==="GET") {
    if (path==="/personas") {
      
      const name = searchParams.get("name");

      if(name) {

        const personsDBbyName = await PersonCollection.find({name}).toArray();
        if(!personsDBbyName)return new Response("Person not found", {status:404});
        const personsByName = await Promise.all(personsDBbyName.map((pm:PersonModel) => fromModelToPerson(pm,PersonCollection)));

        return new Response(JSON.stringify(personsByName));

      }else {

        const personsDB = await PersonCollection.find().toArray();
        if(!personsDB)return new Response("No Persons on the DDBB", {status:404});
        const persons = await Promise.all(personsDB.map((pm:PersonModel) => fromModelToPerson(pm,PersonCollection)));

        return new Response(JSON.stringify(persons));
      
      }

    }else if (path==="/persona") {
      
      const email = searchParams.get("email");
      if(!email)return new Response("Bad Request", {status:400});

      const personByEmailDB = await PersonCollection.findOne({email});
      if(!personByEmailDB)return new Response("Person not found", {status:404});
      const personByEmail = await fromModelToPerson(personByEmailDB,PersonCollection);

      return new Response(JSON.stringify(personByEmail));

    }
  }else if (method==="POST") {
    if (path==="/personas") {
      
      const person = await req.json();
      if (!person.name||!person.email||!person.telefono)return new Response("Bad request", {status:404});

      const email = await PersonCollection.findOne({email: person.email});
      const telefono = await PersonCollection.findOne({telefono: person.telefono});

      if(email||telefono)return new Response("email or telephone number duplicated", {status:400});

      const { insertedId } = await PersonCollection.insertOne({
        name: person.name,
        email:person.email,
        telefono:person.telefono,
        amigos:[],
      })

      return new Response(JSON.stringify({
        name: person.name,
        email:person.email,
        telefono:person.telefono,
        amigos:[],
        id: insertedId,
      }), {status:201});

    }
  }else if (method==="PUT") {
    
    if (path==="/persona") {
      
      const person = await req.json();
      if (!person.name||!person.email||!person.telefono)return new Response("Bad request", {status:404});
    }

  }else if (method==="DELETE") {
    if (path==="/persona") {
      
      const email = searchParams.get("email");
      if(!email)return new Response("Bad Request", {status:400});

      const { deletedCount } = await PersonCollection.deleteOne({email:email});

      if(deletedCount===0)return new Response("Person not found", {status:404});

      await PersonCollection.updateMany(
        {amigos: new ObjectId(email)},
        {$pull: {amigos: new ObjectId(email)}}
      );

      return new Response("Person deleted succesfully", {status:200})

    }
  }

  return new Response("Endpoint not found", {status:404});

}

Deno.serve({port:3000}, handler);
