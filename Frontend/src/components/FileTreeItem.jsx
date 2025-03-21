export const FileTreeItem = ({ name, item, path, onFileOpen }) => {
    return (
        <div
            onClick={() => onFileOpen(name, item)}
            className="flex items-center gap-2 px-2 py-1 hover:bg-[#2d2d2d] cursor-pointer rounded-sm group"
        >
            <i className="ri-file-line text-[#cccccc] text-sm"></i>
            <span className="text-[#cccccc] text-sm group-hover:text-white">
                {name}
            </span>
        </div>
    );
};