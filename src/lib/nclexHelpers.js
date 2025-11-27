// lib/nclexHelpers.js 
export async function fetchCsrf() {
  await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/csrf/`, {
    credentials: 'include',
  });
}

export function getEditorInit(height = 220) {
  return {
    height,
    menubar: true,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'colorpicker'
    ],
    toolbar:
      'undo redo | fontselect fontsizeselect | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | link image | code',
    font_formats:
      'Arial=arial,helvetica,sans-serif; Verdana=verdana,geneva; Tahoma=tahoma,verdana,segui; Georgia=georgia,palatino; Times New Roman=times new roman,times; Courier New=courier new,courier,monospace; Lucida Sans Unicode=lucida sans unicode,lucida grande;',
    fontsize_formats: '10px 12px 14px 16px 18px 20px 24px 30px 36px',
    content_style: 'body { font-family: Arial,Helvetica,sans-serif; font-size:14px }',
    automatic_uploads: false,
  };
}
