const INLINE_TABLE_PATTERN = /([^\n])(\|(?:[^|\n]+\|){2,}.*)/g;
const TABLE_SEPARATOR_PATTERN = /^:?-{3,}:?$/;

export const extractTableCells = (line: string): string[] | null => {
  const stripped = line.trim();
  if (!stripped.startsWith('|')) {
    return null;
  }

  let body = stripped.slice(1);
  if (body.endsWith('|')) {
    body = body.slice(0, -1);
  }

  const cells = body.split('|').map((cell) => cell.trim());
  if (cells.some((cell) => cell.length > 0)) {
    return cells;
  }

  return stripped.replace(/\|/g, '').trim() === '' ? [''] : null;
};

const isTableSeparatorCells = (cells: string[]) =>
  cells.length > 0 && cells.every((cell) => TABLE_SEPARATOR_PATTERN.test(cell));

const formatTableRow = (cells: string[]) => `| ${cells.map((cell) => cell.trim()).join(' | ')} |`;

const padTableCells = (cells: string[], targetColumns: number) => {
  if (cells.length >= targetColumns) {
    return cells.slice(0, targetColumns);
  }

  return [...cells, ...Array(targetColumns - cells.length).fill('')];
};

const fillBlankFirstCells = (rows: string[][]): string[][] => {
  let previousFirstCell = '';

  return rows.map((row) => {
    const currentRow = [...row];
    if (!currentRow[0]?.trim() && currentRow.slice(1).some((cell) => cell.trim()) && previousFirstCell) {
      currentRow[0] = previousFirstCell;
    }
    if (currentRow[0]?.trim()) {
      previousFirstCell = currentRow[0];
    }
    return currentRow;
  });
};

const repairFragmentedTableBlock = (blockLines: string[]): string[] | null => {
  const compactLines = blockLines.filter((line) => line.trim());
  if (compactLines.length < 3) {
    return null;
  }

  const parsedRows: string[][] = [];
  for (const line of compactLines) {
    const cells = extractTableCells(line);
    if (!cells) {
      return null;
    }
    parsedRows.push(cells);
  }

  const separatorStart = parsedRows.findIndex((cells) => isTableSeparatorCells(cells));
  if (separatorStart <= 0) {
    return null;
  }

  const headerCells = parsedRows.slice(0, separatorStart).flat();
  const separatorCells: string[] = [];
  let separatorEnd = separatorStart;

  while (separatorEnd < parsedRows.length && isTableSeparatorCells(parsedRows[separatorEnd])) {
    separatorCells.push(...parsedRows[separatorEnd]);
    separatorEnd += 1;
  }

  if (headerCells.length < 2 || headerCells.length !== separatorCells.length) {
    return null;
  }

  const targetColumns = headerCells.length;
  const rebuiltBlock = [
    formatTableRow(headerCells),
    formatTableRow(separatorCells),
  ];

  let currentCells: string[] = [];
  for (const cells of parsedRows.slice(separatorEnd)) {
    if (isTableSeparatorCells(cells)) {
      return null;
    }

    currentCells = [...currentCells, ...cells];
    while (currentCells.length >= targetColumns) {
      rebuiltBlock.push(formatTableRow(currentCells.slice(0, targetColumns)));
      currentCells = currentCells.slice(targetColumns);
    }
  }

  if (currentCells.length > 0) {
    rebuiltBlock.push(formatTableRow(padTableCells(currentCells, targetColumns)));
  }

  return rebuiltBlock.length > 2 ? rebuiltBlock : null;
};

const canonicalizeTableBlock = (blockLines: string[]): string[] | null => {
  const repairedBlock = repairFragmentedTableBlock(blockLines);
  const compactLines = (repairedBlock || blockLines).filter((line) => line.trim());
  if (compactLines.length < 3) {
    return repairedBlock;
  }

  const parsedRows: string[][] = [];
  for (const line of compactLines) {
    const cells = extractTableCells(line);
    if (!cells) {
      return repairedBlock;
    }
    parsedRows.push(cells);
  }

  const separatorStart = parsedRows.findIndex((cells) => isTableSeparatorCells(cells));
  if (separatorStart !== 1) {
    return repairedBlock;
  }

  const targetColumns = parsedRows[0].length;
  if (targetColumns < 2) {
    return repairedBlock;
  }

  const headerCells = padTableCells(parsedRows[0], targetColumns);
  const separatorCells = padTableCells(parsedRows[1], targetColumns).map((cell) =>
    TABLE_SEPARATOR_PATTERN.test(cell) ? cell : '---',
  );

  const rebuiltBlock = [
    formatTableRow(headerCells),
    formatTableRow(separatorCells),
  ];

  const canonicalRows = fillBlankFirstCells(
    parsedRows.slice(2).map((cells) => padTableCells(cells, targetColumns)),
  );

  for (const cells of canonicalRows) {
    if (isTableSeparatorCells(cells)) {
      continue;
    }
    rebuiltBlock.push(formatTableRow(cells));
  }

  return rebuiltBlock.length > 2 ? rebuiltBlock : repairedBlock;
};

const repairFragmentedTableBlocks = (lines: string[]): string[] => {
  const rebuiltLines: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const currentLine = lines[index];
    if (currentLine.trim().startsWith('|')) {
      const block = [currentLine];
      index += 1;

      while (index < lines.length) {
        const candidate = lines[index];
        if (candidate.trim() && !candidate.trim().startsWith('|')) {
          break;
        }
        block.push(candidate);
        index += 1;
      }

      rebuiltLines.push(...(canonicalizeTableBlock(block) || block));
      continue;
    }

    rebuiltLines.push(currentLine);
    index += 1;
  }

  return rebuiltLines;
};

export const normalizeMarkdownTables = (content: string): string => {
  if (!content) {
    return content;
  }

  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const inlineTableExpanded = normalized.replace(INLINE_TABLE_PATTERN, '$1\n\n$2');
  const lines = repairFragmentedTableBlocks(inlineTableExpanded.split('\n'));
  const rebuilt: string[] = [];
  let previousWasTable = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const stripped = line.trim();
    const isTableLine = stripped.startsWith('|') && stripped.includes('|', 1);
    const nextLine = lines[index + 1]?.trim() || '';
    const nextIsTableLine = nextLine.startsWith('|') && nextLine.includes('|', 1);

    if (!stripped && previousWasTable && nextIsTableLine) {
      continue;
    }

    if (isTableLine && rebuilt.length > 0 && rebuilt[rebuilt.length - 1].trim() && !previousWasTable) {
      rebuilt.push('');
    }

    if (!isTableLine && previousWasTable && stripped) {
      if (rebuilt.length > 0 && rebuilt[rebuilt.length - 1].trim()) {
        rebuilt.push('');
      }
    }

    rebuilt.push(line);
    previousWasTable = isTableLine;
  }

  return rebuilt.join('\n');
};

export const normalizeSnippetForDisplay = (snippet?: string, multiline = false): string => {
  if (!snippet) {
    return '';
  }

  const lines = normalizeMarkdownTables(snippet)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = extractTableCells(line);
      if (cells) {
        if (cells.every((cell) => TABLE_SEPARATOR_PATTERN.test(cell))) {
          return '';
        }
        return cells.join(' | ');
      }

      return line.replace(/\|{2,}/g, ' | ').replace(/\s+/g, ' ').trim();
    })
    .filter(Boolean);

  return multiline ? lines.join('\n') : lines.join(' ');
};
