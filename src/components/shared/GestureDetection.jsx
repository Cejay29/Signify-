// src/components/shared/GestureDetectionBox.jsx
export default function GestureDetectionBox({ detected }) {
    return (
        <div className="mt-3 px-4 py-2 rounded bg-[#2A2A3C] text-xl font-bold">
            Detected: <span className="text-[#27E1C1]">{detected}</span>
        </div>
    );
}
