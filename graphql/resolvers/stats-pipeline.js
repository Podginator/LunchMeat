/**
 * Called before the request function of the first AppSync function in the pipeline.
 * @param ctx The context object that holds contextual information about the function invocation.
 */
export function request(ctx) {
	return {}
}

export function response(ctx) {
	return ctx.source;
}