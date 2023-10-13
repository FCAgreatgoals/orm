export type DiffType = 'added' | 'modified' | 'deleted'
export type Diff = {
	newValue: any;
	type: DiffType
}
export type DiffResult = Record<string, Diff>;
