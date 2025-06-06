import React, { useState, useEffect } from 'react';
import styles from '../styles/components/UploadBotForm.module.css';
import { BotFormData, Bot } from '../types/bot';

interface UploadBotFormProps {
  onSubmit: (data: FormData) => void;
  onError?: (error: string) => void;
  isLoading: boolean;
  isIPFSUploading?: boolean;
  isIPFSLocked?: boolean;
  ipfsStatus?: string;
  onIPFSUpload?: (botId: number) => void;
  editingBot?: Bot | null;
  botId?: number;
}

const UploadBotForm: React.FC<UploadBotFormProps> = ({ 
  onSubmit, 
  onError, 
  isLoading,
  isIPFSUploading,
  isIPFSLocked,
  ipfsStatus,
  onIPFSUpload,
  editingBot,
  botId
}) => {
  const [formData, setFormData] = useState<BotFormData>({
    name: '',
    description: '',
    price: 0,
    trial_time: 0,
    external_link: ''
  });

  const [images, setImages] = useState({
    image1: null as File | null,
    image2: null as File | null,
    image3: null as File | null
  });
  
  // 图片预览URL
  const [imagePreviews, setImagePreviews] = useState({
    image1: '',
    image2: '',
    image3: ''
  });

  // 初始化编辑机器人的数据
  useEffect(() => {
    if (editingBot) {
      setFormData({
        name: editingBot.name,
        description: editingBot.description,
        price: editingBot.price,
        trial_time: editingBot.trial_time,
        external_link: editingBot.external_link || ''
      });

      // 设置图片预览
      const newImagePreviews = { ...imagePreviews };
      if (editingBot.image1) newImagePreviews.image1 = editingBot.image1;
      if (editingBot.image2) newImagePreviews.image2 = editingBot.image2;
      if (editingBot.image3) newImagePreviews.image3 = editingBot.image3;
      setImagePreviews(newImagePreviews);
    }
  }, [editingBot]);

  // 处理表单输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 表单验证逻辑
  const validateFormData = (data: BotFormData): string | null => {
    if (!data.name.trim()) return '机器人名称不能为空';
    if (!data.description.trim()) return '描述不能为空';
    if (data.price < 0) return '价格不能为负数';
    if (data.trial_time < 0) return '试用时间不能为负数';
    if (data.external_link && !/^https?:\/\/.+/.test(data.external_link)) return '外部链接格式不正确';
    return null;
  };

  // 格式化表单数据
  const formatFormData = (data: BotFormData): FormData => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    // 添加图片文件
    Object.entries(images).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file);
      }
    });
    return formData;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateFormData(formData);
    if (error) {
      onError?.(error);
      return;
    }
    const formatted = formatFormData(formData);
    onSubmit(formatted);
  };

  // 处理图片上传
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof images) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImages(prev => ({
        ...prev,
        [field]: file
      }));
      
      // 创建图片预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => ({
          ...prev,
          [field]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 删除已上传的图片
  const handleRemoveImage = (field: keyof typeof images) => {
    setImages(prev => ({
      ...prev,
      [field]: null
    }));
    setImagePreviews(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  return (
    <div className={styles.formContainer}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Bot information</h3>
          
          <div className={styles.formGroup}>
            <label htmlFor="name">Bot name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter bot name"
              className={styles.input}
              disabled={isIPFSLocked}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Detailed description of the bot's features and characteristics"
              className={styles.textarea}
              rows={5}
              disabled={isIPFSLocked}
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Price and trial</h3>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="price">Price (USDT)</label>
              <div className={styles.inputWithIcon}>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className={styles.input}
                  disabled={isIPFSLocked}
                />
                <span className={styles.inputIcon}>USDT</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="trial_time">Trial time (days)</label>
              <div className={styles.inputWithIcon}>
                <input
                  type="number"
                  id="trial_time"
                  name="trial_time"
                  value={formData.trial_time}
                  onChange={handleChange}
                  min="0"
                  required
                  className={styles.input}
                  disabled={isIPFSLocked}
                />
                <span className={styles.inputIcon}>days</span>
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="external_link">External link (optional)</label>
            <input
              type="url"
              id="external_link"
              name="external_link"
              value={formData.external_link}
              onChange={handleChange}
              placeholder="https://"
              className={styles.input}
              disabled={isIPFSLocked}
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Image upload (optional)</h3>
          <div className={styles.imageUploadContainer}>
            {['image1', 'image2', 'image3'].map((field) => (
              <div key={field} className={styles.imageUploadGroup}>
                <label htmlFor={field}>图片 {field.slice(-1)}</label>
                <div className={styles.imagePreview}>
                  {imagePreviews[field as keyof typeof imagePreviews] ? (
                    <div className={styles.imagePreviewContainer}>
                      <img
                        src={imagePreviews[field as keyof typeof imagePreviews]}
                        alt={`预览 ${field}`}
                        className={styles.previewImage}
                      />
                      {!isIPFSLocked && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(field as keyof typeof images)}
                          className={styles.removeImageButton}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ) : (
                    <input
                      type="file"
                      id={field}
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, field as keyof typeof images)}
                      className={styles.fileInput}
                      disabled={isIPFSLocked}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.formActions}>
          <button 
            type="submit" 
            className={styles.submitButton} 
            disabled={isLoading || isIPFSLocked}
          >
            {isLoading ? (
              <>
                <span className={styles.loadingSpinner}></span>
                <span>Saving...</span>
              </>
            ) : 'Save bot'}
          </button>

          {botId && !isIPFSLocked && ipfsStatus !== 'uploaded' && (
            <button
              type="button"
              onClick={() => onIPFSUpload?.(botId)}
              className={`${styles.submitButton} ${styles.ipfsButton}`}
              disabled={isIPFSUploading}
            >
              {isIPFSUploading ? (
                <>
                  <span className={styles.loadingSpinner}></span>
                  <span>Uploading to IPFS...</span>
                </>
              ) : 'Upload to IPFS'}
            </button>
          )}

          {isIPFSLocked && (
            <div className={styles.ipfsStatus}>
              <span className={styles.statusLabel}>IPFS status:</span>
              <span className={`${styles.statusValue} ${styles[ipfsStatus || '']}`}>
                {ipfsStatus === 'uploaded' ? 'Uploaded' : 
                 ipfsStatus === 'failed' ? 'Failed' : 
                 ipfsStatus === 'pending' ? 'Uploading' : 'Draft'}
              </span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default UploadBotForm;