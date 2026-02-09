import { useState } from 'react';

export default function useFormHandler<T extends { [field: string]: unknown }>(fields: T) {
  const newFields: T = JSON.parse(JSON.stringify(fields));
  const [formData, setFormData] = useState(newFields);

	const resetForm = () => {
		setFormData(newFields);
	};

  const handleFormInputChange =
    (name: keyof typeof formData, options?: { mode?: 'static'; restriction?: 'integer' }) =>
			// eslint-disable-next-line
      (event: any) => {
        let eventData;
        if (options?.mode === 'static') {
          eventData = event as unknown as string;
        } else {
          eventData = event.target.value;
        }

        if (options?.restriction === 'integer') {
          eventData = Math.max(0, parseInt(eventData, 10));
        }

        setFormData((prev) => ({
          ...prev,
          [name]: eventData,
        }));
      };

  return { formData, setFormData, handleFormInputChange, resetForm };
}
