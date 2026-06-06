'use client';

import { useState, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { useAnalyzeTreeImageMutation } from '@/store/api/weatherApi';
import { TreeAnalysisResult } from '@/types/weatherai';
import { AlertBanner } from '@/components/layout/AlertBanner';

interface ImageUploaderProps {
  onSuccess: (result: TreeAnalysisResult) => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploader({ onSuccess }: ImageUploaderProps) {
  const [analyzeTree, { isLoading }] = useAnalyzeTreeImageMutation();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [farmerId, setFarmerId] = useState('');
  const [county, setCounty] = useState('');
  const [landAcres, setLandAcres] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (selectedFile: File): boolean => {
    setError(null);
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WEBP are allowed.');
      return false;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 20MB.');
      return false;
    }
    return true;
  };

  const handleFile = (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    if (farmerId) formData.append('farmer_id', farmerId);
    if (county) formData.append('county', county);
    if (landAcres) formData.append('land_acres', landAcres);
    if (location) formData.append('location', location);
    if (notes) formData.append('notes', notes);

    try {
      const result = await analyzeTree(formData).unwrap();
      onSuccess(result);
      clearFile();
      setFarmerId('');
      setCounty('');
      setLandAcres('');
      setLocation('');
      setNotes('');
    } catch (err: any) {
      setError(err?.data?.message || 'Upload failed. Please try again.');
    }
  };

  return (
    <div className="bg-bg-elevated border border-border rounded-md p-6">
      <h3 className="font-mono text-sm text-text-primary uppercase tracking-wider mb-4">
        New Farm Analysis
      </h3>

      {error && (
        <div className="mb-4">
          <AlertBanner variant="danger" message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          className={`relative w-full border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-primary bg-bg-elevated'
              : 'border-border bg-bg-sunken hover:border-border-subtle hover:bg-bg-elevated'
          } ${file ? 'cursor-default p-4 border-border' : ''}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            accept={ALLOWED_TYPES.join(',')}
            className="hidden"
          />

          {preview ? (
            <div className="relative w-full max-w-sm mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="w-full rounded border border-border" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="absolute top-2 right-2 bg-bg-elevated border border-border p-1 rounded hover:bg-bg-sunken transition-colors"
                aria-label="Remove image"
              >
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
          ) : (
            <>
              <UploadCloud className="w-10 h-10 text-text-tertiary mb-3" />
              <p className="font-body text-text-secondary text-sm text-center">
                <span className="text-primary font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="font-mono text-xs text-text-tertiary mt-2">
                JPEG, PNG, WEBP up to 20MB
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-xs text-text-secondary mb-1">Farmer ID (optional)</label>
            <input
              type="text"
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              className="w-full bg-bg-sunken border border-border rounded-sm px-3 py-2 font-body text-sm text-text-primary focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-text-secondary mb-1">County (optional)</label>
            <input
              type="text"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="w-full bg-bg-sunken border border-border rounded-sm px-3 py-2 font-body text-sm text-text-primary focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-text-secondary mb-1">Land Acres (optional)</label>
            <input
              type="number"
              value={landAcres}
              onChange={(e) => setLandAcres(e.target.value)}
              className="w-full bg-bg-sunken border border-border rounded-sm px-3 py-2 font-body text-sm text-text-primary focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-text-secondary mb-1">Location / Zone (optional)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-bg-sunken border border-border rounded-sm px-3 py-2 font-body text-sm text-text-primary focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-mono text-xs text-text-secondary mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-bg-sunken border border-border rounded-sm px-3 py-2 font-body text-sm text-text-primary focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!file || isLoading}
            className={`px-4 py-2 rounded-sm font-mono text-sm transition-colors ${
              !file || isLoading
                ? 'bg-bg-sunken text-text-tertiary cursor-not-allowed border border-border'
                : 'bg-primary text-text-inverse hover:bg-primary-hover'
            }`}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
          </button>
        </div>
      </form>
    </div>
  );
}
