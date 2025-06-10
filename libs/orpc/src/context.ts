const decodeAndVerifyJwtToken = async (_token?: string) => {
  // TODO: Implement JWT decoding and verification
  return {
    id: "1",
    name: "John Doe",
  };
};

export async function createContext({ req }: { req: Request }) {
  async function getUserFromHeader() {
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const user = await decodeAndVerifyJwtToken(authHeader.split(" ")[1]);
      return user;
    }
    return null;
  }
  const user = await getUserFromHeader();
  return {
    user,
  };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
