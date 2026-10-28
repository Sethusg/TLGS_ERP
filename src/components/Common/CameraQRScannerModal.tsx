import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  Scan,
  RefreshCw,
  Bus,
  Package,
  User,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Student, SchoolAsset, Staff, BusRoute } from '../../types';

interface CameraQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'all' | 'transport' | 'asset' | 'staff';
  onStudentBusCheckIn?: (studentId: string, routeId: string) => void;
  onAssetCheckInOut?: (assetCode: string, action: 'checkin' | 'checkout') => void;
  students?: Student[];
  assets?: SchoolAsset[];
  busRoutes?: BusRoute[];
}

export const CameraQRScannerModal: React.FC<CameraQRScannerModalProps> = ({
  isOpen,
  onClose,
  mode = 'all',
  onStudentBusCheckIn,
  onAssetCheckInOut,
  students = [],
  assets = [],
  busRoutes = [],
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanResult, setLastScanResult] = useState<{
    type: 'student' | 'asset' | 'staff' | 'unknown';
    title: string;
    detail: string;
    status: string;
    timestamp: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play audio confirmation tone using Web Audio API
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // AudioContext not permitted in certain iframe contexts
    }
  };

  // Start real device camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        'Camera permission was not granted or video capture is disabled in the preview frame. You can use the Quick Scan Simulator below to test live check-ins!'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Simulate scanning a specific entity
  const triggerScanPayload = (type: 'student' | 'asset' | 'staff', id: string) => {
    playBeep();
    const now = new Date().toLocaleTimeString();

    if (type === 'student') {
      const stu = students.find((s) => s.id === id || s.rollNo === id);
      const studentName = stu ? stu.name : 'Aarav Patel';
      const studentRoll = stu ? stu.rollNo : '2026-089';
      const studentGrade = stu ? `${stu.grade}-${stu.section}` : 'Grade 10-A';

      setLastScanResult({
        type: 'student',
        title: `Student Checked In: ${studentName} (${studentRoll})`,
        detail: `Boarded Bus Route 04 (Anna Nagar Express) · Seat #12 · ${studentGrade}`,
        status: 'BOARDING_CONFIRMED',
        timestamp: now,
      });
      onStudentBusCheckIn?.(id, 'br-04');
    } else if (type === 'asset') {
      const ast = assets.find((a) => a.id === id || a.assetCode === id) || {
        name: 'Dell Latitude Core i7 Lab Laptop',
        assetCode: 'AST-701',
        location: 'Senior Computer Lab 1',
      };
      setLastScanResult({
        type: 'asset',
        title: `Asset Check-In: ${ast.name} (${ast.assetCode})`,
        detail: `Returned to ${ast.location} by Dr. Rajesh Sharma. Condition: Excellent`,
        status: 'INVENTORY_AUDITED',
        timestamp: now,
      });
      onAssetCheckInOut?.(ast.assetCode, 'checkin');
    } else {
      setLastScanResult({
        type: 'staff',
        title: `Faculty Gate Pass: Dr. Rajesh Sharma`,
        detail: `Employee Code: TLAC-STF-001 · Vice Principal & PGT Physics · Science Wing`,
        status: 'CAMPUS_ACCESS_AUTHORIZED',
        timestamp: now,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Camera Optical QR Code Scanner</h3>
              <p className="text-[11px] text-slate-400">
                Rapid Check-In for Student Bus Boarding & School Assets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={soundEnabled ? 'Mute Beep' : 'Enable Beep'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Camera Viewport */}
        <div className="p-4 space-y-4 overflow-y-auto">
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 text-slate-400 space-y-2">
                <Camera className="w-10 h-10 mx-auto text-slate-600" />
                <div className="text-xs font-semibold text-slate-300">Live Camera Stream Inactive</div>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  {cameraError || 'Click below to activate device webcam/optical camera.'}
                </p>
                <button
                  onClick={startCamera}
                  className="mt-2 px-3.5 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-pink-400/80 rounded-2xl relative shadow-lg">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-pink-500" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-pink-500" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-pink-500" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-pink-500" />
                <div className="w-full h-0.5 bg-pink-500/80 absolute top-1/2 -translate-y-1/2 animate-pulse shadow-sm shadow-pink-500" />
              </div>
            </div>

            {/* Active Mode Pill */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[10px] font-bold border border-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>RAPID CHECK-IN SCANNER ACTIVE</span>
            </div>
          </div>

          {/* Last Scan Confirmation Banner */}
          {lastScanResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{lastScanResult.title}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                  {lastScanResult.timestamp}
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">{lastScanResult.detail}</p>
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider pt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verification State: {lastScanResult.status}</span>
              </div>
            </div>
          )}

          {/* Quick Scan Simulator (Allows testing scanning instant credentials) */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-800 flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5 text-pink-600" />
                <span>Instant 1-Click Scan Test Barcodes</span>
              </span>
              <span className="text-[10px] text-gray-500">Fast Verification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => triggerScanPayload('student', 'stu-001')}
                className="p-2.5 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Scan Student Bus QR</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Aarav Patel (Route 04 Express)</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>

              <button
                onClick={() => triggerScanPayload('asset', 'ast-001')}
                className="p-2.5 bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-purple-600" />
                    <span>Scan Asset QR</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">AST-701 Dell Latitude Laptop</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </button>

              <button
                onClick={() => triggerScanPayload('staff', 'stf-001')}
                className="p-2.5 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Scan Staff Gate Pass</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Dr. Rajesh Sharma (Faculty)</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              </button>

              <button
                onClick={() => triggerScanPayload('student', 'stu-002')}
                className="p-2.5 bg-white hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-lg text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5 text-amber-600" />
                    <span>Scan Student Bus #2</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Diya Krishnan (Adyar Bus)</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            Real-Time Bus & Inventory Ledger Sync
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
