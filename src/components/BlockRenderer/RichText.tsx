import { Fragment, type ReactNode } from 'react';

const TOKEN = /<(\/?)(em|strong)>/gi;

export default function RichText({ html }: { html: string }) {
  const stack: { tag: 'em' | 'strong'; children: ReactNode[] }[] = [{ tag: 'em', children: [] }];
  let cursor = 0;
  let m: RegExpExecArray | null;

  while ((m = TOKEN.exec(html)) !== null) {
    const text = html.slice(cursor, m.index);
    if (text) stack[stack.length - 1].children.push(text);
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase() as 'em' | 'strong';
    if (closing) {
      const popped = stack.pop();
      if (popped && stack.length > 0) {
        const Comp = popped.tag;
        stack[stack.length - 1].children.push(
          <Comp key={`${m.index}-${tag}`}>{popped.children}</Comp>,
        );
      }
    } else {
      stack.push({ tag, children: [] });
    }
    cursor = m.index + m[0].length;
  }
  const tail = html.slice(cursor);
  if (tail) stack[stack.length - 1].children.push(tail);

  while (stack.length > 1) {
    const popped = stack.pop()!;
    const Comp = popped.tag;
    stack[stack.length - 1].children.push(<Comp key={`unclosed-${stack.length}`}>{popped.children}</Comp>);
  }

  return <Fragment>{stack[0].children}</Fragment>;
}
