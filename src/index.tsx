import { render } from 'preact';
import { useState, useRef } from 'preact/hooks';

import './style.css';

export function App() {
	const [xmlElement, setXmlElement] = useState<Element | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFile = (file: File) => {
		if (!file || file.type !== 'text/xml') return;

		const reader = new FileReader();
		reader.onload = () => {
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(reader.result as string, 'application/xml');
			const parserError = xmlDoc.getElementsByTagName('parsererror');

			setError(null);
			if (parserError.length > 0) {
				setXmlElement(null);
				setError("Not a valid XML");
			} else {
				const root = xmlDoc.documentElement;
				setXmlElement(root);
				setCollapsedMap(generateDefaultCollapsedMap(root));
			}
		};
		reader.readAsText(file);
	};

	const generateDefaultCollapsedMap = (root: Element) => {
		const map: Record<string, boolean> = {};
		const traverse = (el: Element, path: string, depth: number) => {
			map[path] = depth > 0; // Collapse everything except root
			Array.from(el.children).forEach((child, i) =>
				traverse(child, `${path}.${i}`, depth + 1)
			);
		};
		traverse(root, '0', 0);
		return map;
	};

	const handleDrop = (e: DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer?.files?.[0];
		if (file) handleFile(file);
	};

	const handleDragOver = (e: DragEvent) => e.preventDefault();
	const handleDragEnter = () => setIsDragging(true);
	const handleDragLeave = () => setIsDragging(false);
	const handleFileChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) handleFile(file);
	};
	const handleClick = () => fileInputRef.current?.click();

	return (
		<div class="mx-auto p-6 space-y-6">
			<h1 class="text-3xl font-bold text-center">Upload XML File</h1>

			<div
				className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-300 ${isDragging ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300'}`}
				onClick={handleClick}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
			>
				<p class="text-gray-600">
					{isDragging
						? 'Drop the file here…'
						: 'Click or drag & drop your XML file here. This file will not be sent to any servers.'}
				</p>
			</div>

			<input
				ref={fileInputRef}
				type="file"
				accept=".xml"
				class="hidden"
				onChange={handleFileChange}
			/>

			{error && <div class="text-red-600 font-semibold">{error}</div>}
			{xmlElement && (
				<XmlView
					xmlElement={xmlElement}
					collapsedMap={collapsedMap}
					setCollapsedMap={setCollapsedMap}
				/>
			)}
		</div>
	);
}

const XmlView = ({
	xmlElement,
	collapsedMap,
	setCollapsedMap,
}: {
	xmlElement: Element;
	collapsedMap: Record<string, boolean>;
	setCollapsedMap: (map: Record<string, boolean>) => void;
}) => {
	const expandAll = () => {
		const map: Record<string, boolean> = {};
		const traverse = (el: Element, path: string) => {
			map[path] = false;
			Array.from(el.children).forEach((child, i) =>
				traverse(child, `${path}.${i}`)
			);
		};
		traverse(xmlElement, '0');
		setCollapsedMap(map);
	};

	const collapseAll = () => {
		const map: Record<string, boolean> = {};
		const traverse = (el: Element, path: string) => {
			map[path] = true;
			Array.from(el.children).forEach((child, i) =>
				traverse(child, `${path}.${i}`)
			);
		};
		traverse(xmlElement, '0');
		setCollapsedMap(map);
	};

	return (
		<div class="space-y-4">
			<div class="flex gap-2">
				<button
					type="button"
					class="rounded bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
					onClick={expandAll}
				>
					Expand all
				</button>
				<button
					type="button"
					class="rounded bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
					onClick={collapseAll}
				>
					Collapse all
				</button>
			</div>
			<XmlViewer
				node={xmlElement}
				path="0"
				collapsedMap={collapsedMap}
				setCollapsedMap={setCollapsedMap}
				depth={0}
			/>
		</div>
	);
};

const XmlViewer = ({
	node,
	depth = 0,
	path,
	collapsedMap,
	setCollapsedMap,
}: {
	node: Element;
	depth?: number;
	path: string;
	collapsedMap: Record<string, boolean>;
	setCollapsedMap: (map: Record<string, boolean>) => void;
}) => {
	const children = Array.from(node.children);
	const hasChildren = children.length > 0;

	return (
		<div class="pl-4 font-mono text-sm">
			{!hasChildren ? (
				<XmlLeaf node={node} />
			) : (
				<XmlTree
					node={node}
					children={children}
					depth={depth}
					path={path}
					collapsedMap={collapsedMap}
					setCollapsedMap={setCollapsedMap}
				/>
			)}
		</div>
	);
};

const XmlTree = ({
	node,
	children,
	depth,
	path,
	collapsedMap,
	setCollapsedMap,
}: {
	node: Element;
	children: Element[];
	depth: number;
	path: string;
	collapsedMap: Record<string, boolean>;
	setCollapsedMap: (map: Record<string, boolean>) => void;
}) => {
	const collapsed = collapsedMap[path] ?? (depth > 0);

	const toggle = () => {
		setCollapsedMap({
			...collapsedMap,
			[path]: !collapsed,
		});
	};

	return (
		<div class="ml-4">
			<div
				class="cursor-pointer flex items-center space-x-2"
				onClick={toggle}
			>
				<span class="font-medium">{stripNamespace(node.nodeName)}</span>
				<span
					class={`transition-transform duration-200 inline-block ${collapsed ? '' : 'rotate-90'}`}
				>
					▶
				</span>
			</div>

			{!collapsed && (
				<div class="ml-4 border-l border-gray-200 pl-4 mt-1 space-y-1">
					{children.map((child, index) => (
						<XmlViewer
							key={index}
							node={child}
							depth={depth + 1}
							path={`${path}.${index}`}
							collapsedMap={collapsedMap}
							setCollapsedMap={setCollapsedMap}
						/>
					))}
				</div>
			)}
		</div>
	);
};

const XmlLeaf = ({ node }: { node: Element }) => (
	<div class="ml-4 text-gray-800">
		<span class="font-medium">{stripNamespace(node.nodeName)}:</span>
		<span class="ml-1 font-semibold">{limitContent(node.textContent)}</span>
	</div>
);

function limitContent(content: string | null) {
	const max = 80;
	if (!content) return "";
	content = content.trim();
	if (content.length > max) {
		return content.slice(0, max) + "...";
	}
	return content;
}

function stripNamespace(tagName: string) {
	return tagName.includes(":") ? tagName.split(":")[1] : tagName;
}

render(<App />, document.getElementById('app') as HTMLElement);
