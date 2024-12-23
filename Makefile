
TOPDIR=$(PWD)


tinymce760:
	mkdir -p assets ; \
	cd assets ; \
	wget https://download.tiny.cloud/tinymce/community/tinymce_7.6.0_dev.zip && unzip tinymce_7.6.0_dev.zip && \
	mv tinymce tinymce_7.6.0_dev && rm tinymce_7.6.0_dev.zip ; \
	wget https://download.tiny.cloud/tinymce/community/tinymce_7.6.0.zip && unzip tinymce_7.6.0.zip && \
	mv tinymce tinymce_7.6.0 && rm tinymce_7.6.0.zip ; \


