import queryString from "query-string";
import { $path, type Routes, type RoutesWithParams } from "safe-routes";
import { ZodNull, ZodSchema, ZodType, z } from "zod";

// note: If you see a linter error related to `Routes`, or `RoutesWithParams`,
// it's probably because you need to run `pnpm run dev` or `pnpm run build`
// these types are generated by safe-routes, and are used to provide type
// safety when navigating through the app

const QuerySchemas = {
	agentSchema: z.object({
		threadId: z.string().nullish(),
		from: z.string().nullish(),
	}),
	threadsListSchema: z.object({
		agentId: z.string().nullish(),
		userId: z.string().nullish(),
		workflowId: z.string().nullish(),
		from: z.enum(["workflows", "agents", "users"]).nullish().catch(null),
	}),
	workflowSchema: z.object({
		threadId: z.string().nullish(),
	}),
} as const;

function parseQuery<T extends ZodType>(search: string, schema: T) {
	if (schema instanceof ZodNull) return null;

	const obj = queryString.parse(search);
	const { data, success } = schema.safeParse(obj);

	if (!success) {
		console.error("Failed to parse query params", search);
		return null;
	}

	return data;
}

const exactRegex = (path: string) => new RegExp(`^${path}$`);

type RouteHelper = {
	regex: RegExp;
	path: keyof Routes;
	schema: ZodSchema;
};

export const RouteHelperMap = {
	"": {
		regex: exactRegex($path("")),
		path: "/",
		schema: z.null(),
	},
	"/": {
		regex: exactRegex($path("/")),
		path: "/",
		schema: z.null(),
	},
	"/agents": {
		regex: exactRegex($path("/agents")),
		path: "/agents",
		schema: z.null(),
	},
	"/agents/:agent": {
		regex: exactRegex($path("/agents/:agent", { agent: "(.+)" })),
		path: "/agents/:agent",
		schema: QuerySchemas.agentSchema,
	},
	"/debug": {
		regex: exactRegex($path("/debug")),
		path: "/debug",
		schema: z.null(),
	},
	"/home": {
		regex: exactRegex($path("/home")),
		path: "/home",
		schema: z.null(),
	},
	"/model-providers": {
		regex: exactRegex($path("/model-providers")),
		path: "/model-providers",
		schema: z.null(),
	},
	"/threads/:id": {
		regex: exactRegex($path("/threads/:id", { id: "(.+)" })),
		path: "/threads/:id",
		schema: z.null(),
	},
	"/threads": {
		regex: exactRegex($path("/threads")),
		path: "/threads",
		schema: QuerySchemas.threadsListSchema,
	},
	"/tools": {
		regex: exactRegex($path("/tools")),
		path: "/tools",
		schema: z.null(),
	},
	"/users": {
		regex: exactRegex($path("/users")),
		path: "/users",
		schema: z.null(),
	},
	"/workflow-triggers": {
		regex: exactRegex($path("/workflow-triggers")),
		path: "/workflow-triggers",
		schema: z.null(),
	},
	"/workflow-triggers/schedule/create": {
		regex: exactRegex($path("/workflow-triggers/schedule/create")),
		path: "/workflow-triggers/schedule/create",
		schema: z.null(),
	},
	"/workflow-triggers/schedule/:trigger": {
		regex: exactRegex(
			$path("/workflow-triggers/schedule/:trigger", {
				trigger: "(.+)",
			})
		),
		path: "/workflow-triggers/schedule/:trigger",
		schema: z.null(),
	},
	"/workflow-triggers/webhooks/create": {
		regex: exactRegex($path("/workflow-triggers/webhooks/create")),
		path: "/workflow-triggers/webhooks/create",
		schema: z.null(),
	},
	"/workflow-triggers/webhooks/:webhook": {
		regex: exactRegex(
			$path("/workflow-triggers/webhooks/:webhook", { webhook: "(.+)" })
		),
		path: "/workflow-triggers/webhooks/:webhook",
		schema: z.null(),
	},
	"/workflow-triggers/email/create": {
		regex: exactRegex($path("/workflow-triggers/email/create")),
		path: "/workflow-triggers/email/create",
		schema: z.null(),
	},
	"/workflow-triggers/email/:receiver": {
		regex: exactRegex(
			$path("/workflow-triggers/email/:receiver", { receiver: "(.+)" })
		),
		path: "/workflow-triggers/email/:receiver",
		schema: z.null(),
	},
	"/workflows": {
		regex: exactRegex($path("/workflows")),
		path: "/workflows",
		schema: z.null(),
	},
	"/workflows/:workflow": {
		regex: exactRegex($path("/workflows/:workflow", { workflow: "(.+)" })),
		path: "/workflows/:workflow",
		schema: QuerySchemas.workflowSchema,
	},
} satisfies Record<keyof Routes, RouteHelper>;

type QueryInfo<T extends keyof Routes> = z.infer<
	(typeof RouteHelperMap)[T]["schema"]
>;

type PathInfo<T extends keyof RoutesWithParams> = {
	[key in keyof Routes[T]["params"]]: string;
};

type RoutePathInfo<T extends keyof Routes> = T extends keyof RoutesWithParams
	? PathInfo<T>
	: unknown;

export type RouteInfo<T extends keyof Routes = keyof Routes> = {
	path: T;
	query: QueryInfo<T> | null;
	pathParams: RoutePathInfo<T>;
};

function convertToStringObject(obj: object) {
	return Object.fromEntries(
		Object.entries(obj).map(([key, value]) => [key, String(value)])
	);
}

function getRouteInfo<T extends keyof Routes>(
	path: T,
	url: URL,
	params: Record<string, string | undefined>
): RouteInfo<T> {
	const helper = RouteHelperMap[path];

	return {
		path,
		query: parseQuery(url.search, helper.schema),
		pathParams: convertToStringObject(params) as RoutePathInfo<T>,
	};
}

// note: this is a ✨fancy✨ way of saying
// type UnknownRouteInfo = RouteInfo<keyof Routes>
// but it is needed to discriminate between the different routes
// via the `path` property
type UnknownRouteInfo = {
	[key in keyof Routes]: RouteInfo<key>;
}[keyof Routes];

function getUnknownRouteInfo(
	url: URL,
	params: Record<string, string | undefined>
) {
	for (const route of Object.values(RouteHelperMap)) {
		if (route.regex.test(url.pathname))
			return {
				path: route.path,
				query: parseQuery(url.search, route.schema as ZodSchema),
				pathParams: convertToStringObject(params),
			} as UnknownRouteInfo;
	}

	return null;
}

export type RouteQueryParams<T extends keyof typeof QuerySchemas> = z.infer<
	(typeof QuerySchemas)[T]
>;

const getQueryParams = <T extends keyof Routes>(path: T, search: string) =>
	parseQuery(search, RouteHelperMap[path].schema) as RouteInfo<T>["query"];

export const RouteService = {
	schemas: QuerySchemas,
	getUnknownRouteInfo,
	getRouteInfo,
	getQueryParams,
};
