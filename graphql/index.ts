import { ApolloServer, gql } from "apollo-server-azure-functions";
import { CosmosClient } from "@azure/cosmos";

const client = new CosmosClient(process.env.CosmosKey);

const typeDefs = gql`
  type Record {
    id: ID
    userId: String
    vanityUrl: String!
    description: String
    links: [Link]
  }

  type Link {
    id: String
    url: String!
    title: String!
    description: String
    image: String
  }

  # Query to unpack a link
  type Query {
    getByVanityUrl(vanity: String): Record
    getForUser(userId: String): [Record]!
  }
`;
const resolvers = {
  Query: {
    async getByVanityUrl(_, { vanity }: { vanity: string }) {
      console.log(JSON.stringify(arguments));
      let results = await client
        .database("linkylinkdb")
        .container("linkbundles")
        .items.query({
          query: "SELECT * FROM c WHERE c.vanityUrl = @vanity",
          parameters: [
            {
              name: "@vanity",
              value: vanity,
            },
          ],
        })
        .fetchAll();

      if (results.resources.length > 0) {
        return results.resources[0];
      }
      return null;
    },
    async getForUser(_, { userId }: { userId: string }) {
      let results = await client
        .database("linkylinkdb")
        .container("linkbundles")
        .items.query({
          query: "SELECT * FROM c WHERE c.userId = @userId",
          parameters: [
            {
              name: "@userId",
              value: userId,
            },
          ],
        })
        .fetchAll();

      return results.resources;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
export default server.createHandler();
