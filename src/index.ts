import express, { Express, Request, Response } from "express";
import knex from "knex";

interface Transponder {
  id: number;
  name: string;
  children: Transponder[];
}

interface TransponderWithParent {
  id: number;
  name: string;
  parentId: number | null;
}

const db = knex({
  client: "sqlite3",
  connection: {
    filename: "./db/transponders.db",
  },
  useNullAsDefault: true,
});

const app: Express = express();
const port = 3000;

app.use(express.json());

function toTransponder({ id, name }: TransponderWithParent): Transponder {
  return { id, name, children: [] as Transponder[] };
}

function buildTransponderGraph(
  transponders: TransponderWithParent[]
): Transponder[] {
  const rootNodes = transponders
    .filter((t) => t.parentId == null)
    .map(toTransponder);

  const childNodes = transponders.filter((t) => t.parentId != null);

  const nodesByParentId = childNodes.reduce((acc, t) => {
    if (t.parentId == null) return acc;

    if (acc[t.parentId] == null) {
      acc[t.parentId] = [t];
    } else {
      acc[t.parentId].push(t);
    }

    return acc;
  }, {} as Record<number, TransponderWithParent[]>);

  const buildTree = (t: Transponder): Transponder => {
    t.children = (nodesByParentId[t.id] ?? []).map((t) =>
      buildTree(toTransponder(t))
    );

    return t;
  };

  return rootNodes.map(buildTree);
}

async function fetchTransponders(): Promise<TransponderWithParent[]> {
  return db
    .select(
      "transponders.id",
      "transponders.name",
      "transponder_relations.parentId"
    )
    .from("transponders")
    .leftJoin(
      "transponder_relations",
      "transponders.id",
      "transponder_relations.childId"
    );
}

app.get("/transponders", async (_: Request, res: Response) => {
  const transponders = await fetchTransponders();
  res.json(buildTransponderGraph(transponders));
});

app.get("/count", async (req: Request, res: Response) => {
  if (req.query.id != null) {
    const count = await db("transponder_relations")
      .where({
        parentId: req.query.id,
      })
      .count("id as count");
    res.json(count[0]);
  } else {
    const count = await db("transponders").count("id as count");
    res.json(count[0]);
  }
});

app.listen(port, () => {
  console.log(`Server is running at https://localhost:${port}`);
});
