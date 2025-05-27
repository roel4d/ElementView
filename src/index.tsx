import { render } from 'preact';
import { useState, useRef } from 'preact/hooks';

import './style.css';

export function App() {
	const [xmlElement, setXmlElement] = useState<Element | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFile = (file: File) => {
		if (!file || file.type !== 'text/xml') return;

		const reader = new FileReader();
		reader.onload = () => {
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(reader.result as string, 'application/xml');
			const parserError = xmlDoc.getElementsByTagName('parsererror');

			setError(null);
			setXmlElement(null);
			if (parserError.length > 0) {
				setError("Not a valid XML");
			} else {
				setXmlElement(xmlDoc.documentElement);
			}
		};
		reader.readAsText(file);
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
		<div class=" mx-auto p-6 space-y-6">
			<h1 class="text-3xl font-bold text-center">Upload XML File</h1>

			<div
				className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-300 ${isDragging ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300'
					}`}
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
			{xmlElement && <XmlViewer node={xmlElement} />}
		</div>
	);
}

const XmlViewer = ({ node }: { node: Element }) => {
	const children = Array.from(node.children);
	const hasChildren = children.length > 0;

	return (
		<div class="pl-4 font-mono text-sm">
			{!hasChildren ? <XmlLeaf node={node} /> : <XmlTree node={node} children={children} />}
		</div>
	);
};


function limitContent(content: string) {
	const max = 80;
	if (!content) return "";
	content = content.trim();
	if (content.length > max) {
		return content.slice(0, max) + "...";
	}
	return content;
}

const XmlLeaf = ({ node }: { node: Element }) => (
	<div class="ml-4 text-gray-800">
		<span class="font-medium ">{stripNamespace(node.nodeName)}:</span>
		<span class="ml-1 font-semibold">{limitContent(node.textContent)}</span>
	</div>
);

function stripNamespace(tagName: string) {
	return tagName.includes(":") ? tagName.split(":")[1] : tagName;
}

const XmlTree = ({ node, children }: { node: Element; children: Element[] }) => {
	const [collapsed, setCollapsed] = useState(false);
	const toggle = () => setCollapsed(prev => !prev);

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
						<XmlViewer key={index} node={child} />
					))}
				</div>
			)}
		</div>
	);
};


render(<App />, document.getElementById('app') as HTMLElement);
