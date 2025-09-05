// language.js
// Central de strings com suporte a PT/EN/ES + helper de tradução com fallback.
// Uso: t('pt', 'auth.login_required_like.title')
//      t(user.lang, 'errors.validation.required_field', { field: 'Email' })

const STRINGS = {
  pt: {
    app: { name: "Cristãos App" },
    common: {
      ok: "OK",
      cancel: "Cancelar",
      close: "Fechar",
      save: "Salvar",
      edit: "Editar",
      retry: "Tentar novamente",
      continue: "Continuar",
      back: "Voltar",
      yes: "Sim",
      no: "Não",
      delete: "Excluir",
      remove: "Remover",
      change: "Trocar",
      upload: "Upload",
      login: "Entrar",
      signup: "Cadastrar",
      logout: "Sair",
      settings: "Configurações",
      manage: "Gerenciar",
      enable: "Ativar",
      disable: "Desativar",
      view: "Ver",
      open: "Abrir",
      copy: "Copiar",
      copied: "Copiado!",
      report: "Reportar",
      block: "Bloquear",
      unblock: "Desbloquear",
      send: "Enviar",
      accept: "Aceitar",
      reject: "Recusar"
    },

    auth: {
      login_required_generic: {
        title: "É preciso estar logado",
        body: "Faça login para continuar."
      },
      login_required_like: {
        title: "Entre para curtir",
        body: "Você precisa estar logado para curtir publicações."
      },
      login_required_share: {
        title: "Entre para compartilhar",
        body: "Você precisa estar logado para compartilhar conteúdo."
      },
      login_required_comment: {
        title: "Entre para comentar",
        body: "Faça login para escrever e enviar comentários."
      },
      login_required_follow: {
        title: "Entre para adicionar amigo",
        body: "Faça login para enviar pedidos de amizade."
      },
      login_required_message: {
        title: "Entre para enviar mensagem",
        body: "Você precisa estar logado para iniciar uma conversa."
      },
      session_expired: {
        title: "Sessão expirada",
        body: "Faça login novamente para continuar."
      },
      email_not_verified: {
        title: "E-mail não verificado",
        body: "Verifique seu e-mail para usar esta funcionalidade."
      },
      reset_link_sent: {
        title: "Link enviado",
        body: "Enviamos um link para redefinir sua senha."
      },
      verification_sent: {
        title: "Verificação enviada",
        body: "Enviamos um link para verificar sua conta."
      }
    },

    actions: {
      like_success: { title: "Curtido", body: "Você curtiu esta publicação." },
      like_removed: { title: "Removido", body: "Você removeu sua curtida." },
      share_success: { title: "Compartilhado", body: "Conteúdo compartilhado com sucesso." },
      share_copied: { title: "Link copiado", body: "O link foi copiado para sua área de transferência." },
      comment_posted: { title: "Comentário enviado", body: "Seu comentário foi publicado." },
      comment_deleted: { title: "Comentário excluído", body: "O comentário foi removido." },
      comment_delete_confirm: {
        title: "Excluir comentário?",
        body: "Essa ação não pode ser desfeita."
      },
      save_success: { title: "Salvo", body: "Alterações salvas com sucesso." },
      save_error: { title: "Falha ao salvar", body: "Não foi possível salvar suas alterações." }
    },

    profile: {
      bio_updated: { title: "Bio atualizada", body: "Sua biografia foi salva." },
      friend_request_sent: { title: "Pedido enviado", body: "Seu pedido de amizade foi enviado." },
      friend_request_accepted: { title: "Amizade aceita", body: "Agora vocês são amigos." },
      friend_removed: { title: "Amigo removido", body: "Você removeu este amigo." },
      blocked: { title: "Usuário bloqueado", body: "Você não verá mais conteúdo deste usuário." },
      unblocked: { title: "Usuário desbloqueado", body: "Bloqueio removido com sucesso." },
      cannot_message_self: { title: "Ação indisponível", body: "Você não pode enviar mensagem para si mesmo." }
    },

    listings: {
      create_success: { title: "Publicado", body: "Sua postagem foi publicada." },
      update_success: { title: "Atualizado", body: "Sua postagem foi atualizada." },
      delete_confirm: { title: "Excluir postagem?", body: "Essa ação não pode ser desfeita." },
      delete_success: { title: "Excluída", body: "Sua postagem foi removida." },
      delete_error: { title: "Falha ao excluir", body: "Não foi possível remover a postagem." },
      report_confirm: { title: "Reportar conteúdo?", body: "Nossa equipe analisará o conteúdo reportado." },
      report_sent: { title: "Report enviado", body: "Obrigado por nos ajudar a manter a comunidade segura." }
    },

    comments: {
      empty_text: { title: "Nada para enviar", body: "Digite uma mensagem antes de enviar." },
      like_login_needed: { title: "Entre para curtir", body: "Faça login para curtir comentários." }
    },

    chat: {
      request_sent: { title: "Convite enviado", body: "Seu pedido de conversa foi enviado." },
      request_pending: { title: "Convite pendente", body: "Aguardando o outro usuário aceitar." },
      request_accepted: { title: "Conversa criada", body: "Vocês agora podem conversar." },
      request_rejected: { title: "Convite recusado", body: "O convite foi recusado." },
      join_error: { title: "Falha no chat", body: "Não foi possível entrar na conversa." }
    },

    notifications: {
      all_marked_read: { title: "Tudo lido", body: "Suas notificações foram marcadas como lidas." },
      mark_read_error: { title: "Falha ao marcar", body: "Não foi possível marcar como lidas." },
      email_enabled: { title: "E-mails ativados", body: "Você receberá notificações por e-mail." },
      email_disabled: { title: "E-mails desativados", body: "Você não receberá notificações por e-mail." },
      email_toggle_error: { title: "Falha ao atualizar", body: "Não foi possível alterar sua preferência de e-mail." },
      manage_hint: {
        title: "Gerenciar notificações",
        body: "Você pode gerenciar suas preferências de e-mail na página de Notificações."
      }
    },

    churches: {
      create_success: { title: "Igreja registrada", body: "A igreja foi cadastrada com sucesso." },
      update_success: { title: "Igreja atualizada", body: "Os dados da igreja foram salvos." },
      delete_confirm: { title: "Excluir igreja?", body: "Essa ação não pode ser desfeita." },
      delete_success: { title: "Igreja excluída", body: "A igreja foi removida." },
      geocode_start: { title: "Buscando coordenadas", body: "Localizando latitude/longitude do endereço..." },
      geocode_success: { title: "Coordenadas encontradas", body: "Latitude e longitude foram preenchidas." },
      geocode_error: { title: "Falha no geocoding", body: "Não foi possível obter as coordenadas." },
      gallery_add_success: { title: "Foto adicionada", body: "A imagem foi incluída na galeria." },
      gallery_remove_confirm: { title: "Remover foto?", body: "A imagem será removida da galeria." },
      gallery_remove_success: { title: "Foto removida", body: "Imagem removida da galeria." },
      statement_upload_success: { title: "PDF enviado", body: "Documento anexado com sucesso." },
      statement_upload_error: { title: "Falha no upload", body: "Não foi possível anexar o documento." }
    },

    uploads: {
      uploading: { title: "Enviando...", body: "Aguarde enquanto fazemos o upload." },
      success: { title: "Upload concluído", body: "Arquivo enviado com sucesso." },
      error: { title: "Falha no upload", body: "Não foi possível enviar o arquivo." },
      too_large: { title: "Arquivo muito grande", body: "O tamanho máximo é {maxMB} MB." },
      invalid_type: { title: "Formato inválido", body: "Formatos aceitos: {types}." }
    },

    mural: {
      posted: { title: "Mensagem enviada", body: "Seu recado foi publicado no mural." },
      error: { title: "Falha ao enviar", body: "Não foi possível publicar no mural." }
    },

    polls: {
      vote_success: { title: "Voto registrado", body: "Obrigado por participar." },
      already_voted: { title: "Já votado", body: "Você já votou nesta enquete." },
      closed: { title: "Enquete encerrada", body: "Esta enquete não aceita mais votos." }
    },

    validation: {
      required_field: { title: "Campo obrigatório", body: "Preencha o campo {field}." },
      min_length: { title: "Muito curto", body: "{field} deve ter pelo menos {min} caracteres." },
      max_length: { title: "Muito longo", body: "{field} deve ter no máximo {max} caracteres." },
      invalid_email: { title: "E-mail inválido", body: "Informe um endereço de e-mail válido." },
      invalid_url: { title: "URL inválida", body: "Informe uma URL válida (ex.: https://...)." },
      passwords_mismatch: { title: "Senhas não conferem", body: "Digite a mesma senha nos dois campos." },
      invalid_credentials: { title: "Credenciais inválidas", body: "E-mail e/ou senha incorretos." }
    },

    geo: {
      permission_denied: { title: "Sem permissão", body: "Conceda acesso à localização para continuar." },
      browser_unsupported: { title: "Recurso indisponível", body: "Seu navegador não suporta geolocalização." },
      coords_copied: { title: "Coordenadas copiadas", body: "Latitude/longitude copiadas para a área de transferência." }
    },

    presence: {
      check_in_success: { title: "Presença registrada", body: "Sua presença foi registrada com sucesso." },
      check_out_success: { title: "Saída registrada", body: "Saída registrada com sucesso." },
      already_checked_in: { title: "Já registrado", body: "Você já registrou presença." }
    },

    errors: {
      network_offline: { title: "Sem conexão", body: "Verifique sua internet e tente novamente." },
      network_timeout: { title: "Tempo esgotado", body: "A conexão demorou demais. Tente novamente." },
      unauthorized: { title: "Não autorizado", body: "Faça login para continuar." },
      forbidden: { title: "Acesso negado", body: "Você não tem permissão para isso." },
      not_found: { title: "Não encontrado", body: "O recurso solicitado não foi encontrado." },
      rate_limited: { title: "Muitas tentativas", body: "Tente novamente em alguns instantes." },
      server_error: { title: "Erro no servidor", body: "Ocorreu um erro inesperado. Tente novamente mais tarde." },
      unknown: { title: "Erro desconhecido", body: "Algo deu errado. Tente novamente." }
    }
  },

  en: {
    app: { name: "Cristãos App" },
    common: {
      ok: "OK",
      cancel: "Cancel",
      close: "Close",
      save: "Save",
      edit: "Edit",
      retry: "Retry",
      continue: "Continue",
      back: "Back",
      yes: "Yes",
      no: "No",
      delete: "Delete",
      remove: "Remove",
      change: "Change",
      upload: "Upload",
      login: "Log in",
      signup: "Sign up",
      logout: "Log out",
      settings: "Settings",
      manage: "Manage",
      enable: "Enable",
      disable: "Disable",
      view: "View",
      open: "Open",
      copy: "Copy",
      copied: "Copied!",
      report: "Report",
      block: "Block",
      unblock: "Unblock",
      send: "Send",
      accept: "Accept",
      reject: "Reject"
    },

    auth: {
      login_required_generic: {
        title: "Login required",
        body: "Please log in to continue."
      },
      login_required_like: {
        title: "Log in to like",
        body: "You must be logged in to like posts."
      },
      login_required_share: {
        title: "Log in to share",
        body: "You must be logged in to share content."
      },
      login_required_comment: {
        title: "Log in to comment",
        body: "Log in to write and send comments."
      },
      login_required_follow: {
        title: "Log in to add friend",
        body: "Log in to send friend requests."
      },
      login_required_message: {
        title: "Log in to message",
        body: "You must be logged in to start a conversation."
      },
      session_expired: {
        title: "Session expired",
        body: "Please log in again to continue."
      },
      email_not_verified: {
        title: "Email not verified",
        body: "Verify your email to use this feature."
      },
      reset_link_sent: {
        title: "Link sent",
        body: "We sent you a password reset link."
      },
      verification_sent: {
        title: "Verification sent",
        body: "We sent you an account verification link."
      }
    },

    actions: {
      like_success: { title: "Liked", body: "You liked this post." },
      like_removed: { title: "Removed", body: "You removed your like." },
      share_success: { title: "Shared", body: "Content shared successfully." },
      share_copied: { title: "Link copied", body: "The link was copied to your clipboard." },
      comment_posted: { title: "Comment posted", body: "Your comment has been published." },
      comment_deleted: { title: "Comment deleted", body: "The comment was removed." },
      comment_delete_confirm: {
        title: "Delete comment?",
        body: "This action cannot be undone."
      },
      save_success: { title: "Saved", body: "Changes saved successfully." },
      save_error: { title: "Save failed", body: "We couldn't save your changes." }
    },

    profile: {
      bio_updated: { title: "Bio updated", body: "Your bio has been saved." },
      friend_request_sent: { title: "Request sent", body: "Your friend request has been sent." },
      friend_request_accepted: { title: "Friendship accepted", body: "You are now friends." },
      friend_removed: { title: "Friend removed", body: "You removed this friend." },
      blocked: { title: "User blocked", body: "You won't see content from this user." },
      unblocked: { title: "User unblocked", body: "Block removed successfully." },
      cannot_message_self: { title: "Unavailable", body: "You can't message yourself." }
    },

    listings: {
      create_success: { title: "Published", body: "Your post has been published." },
      update_success: { title: "Updated", body: "Your post has been updated." },
      delete_confirm: { title: "Delete post?", body: "This action cannot be undone." },
      delete_success: { title: "Deleted", body: "Your post has been removed." },
      delete_error: { title: "Delete failed", body: "We couldn't remove the post." },
      report_confirm: { title: "Report content?", body: "Our team will review the report." },
      report_sent: { title: "Report sent", body: "Thanks for helping keep the community safe." }
    },

    comments: {
      empty_text: { title: "Nothing to send", body: "Type a message before sending." },
      like_login_needed: { title: "Log in to like", body: "Log in to like comments." }
    },

    chat: {
      request_sent: { title: "Invite sent", body: "Your chat request was sent." },
      request_pending: { title: "Pending invite", body: "Waiting for the other user to accept." },
      request_accepted: { title: "Conversation created", body: "You can chat now." },
      request_rejected: { title: "Invite rejected", body: "The invite was declined." },
      join_error: { title: "Chat failed", body: "Couldn't join the conversation." }
    },

    notifications: {
      all_marked_read: { title: "All read", body: "Your notifications were marked as read." },
      mark_read_error: { title: "Failed to mark", body: "Couldn't mark as read." },
      email_enabled: { title: "Emails enabled", body: "You'll receive notifications via email." },
      email_disabled: { title: "Emails disabled", body: "You won't receive email notifications." },
      email_toggle_error: { title: "Update failed", body: "Couldn't change your email preference." },
      manage_hint: {
        title: "Manage notifications",
        body: "You can manage email preferences on the Notifications page."
      }
    },

    churches: {
      create_success: { title: "Church registered", body: "The church was saved successfully." },
      update_success: { title: "Church updated", body: "Church data has been saved." },
      delete_confirm: { title: "Delete church?", body: "This action cannot be undone." },
      delete_success: { title: "Church deleted", body: "The church was removed." },
      geocode_start: { title: "Fetching coordinates", body: "Resolving address to latitude/longitude..." },
      geocode_success: { title: "Coordinates found", body: "Latitude and longitude were filled in." },
      geocode_error: { title: "Geocoding failed", body: "Couldn't get coordinates." },
      gallery_add_success: { title: "Photo added", body: "Image has been added to the gallery." },
      gallery_remove_confirm: { title: "Remove photo?", body: "This image will be removed from the gallery." },
      gallery_remove_success: { title: "Photo removed", body: "Image removed from the gallery." },
      statement_upload_success: { title: "PDF uploaded", body: "Document attached successfully." },
      statement_upload_error: { title: "Upload failed", body: "Couldn't attach the document." }
    },

    uploads: {
      uploading: { title: "Uploading...", body: "Please wait while we upload your file." },
      success: { title: "Upload complete", body: "File uploaded successfully." },
      error: { title: "Upload failed", body: "We couldn't upload the file." },
      too_large: { title: "File too large", body: "Maximum size is {maxMB} MB." },
      invalid_type: { title: "Invalid format", body: "Accepted formats: {types}." }
    },

    mural: {
      posted: { title: "Message posted", body: "Your note was published on the wall." },
      error: { title: "Send failed", body: "Couldn't post to the wall." }
    },

    polls: {
      vote_success: { title: "Vote recorded", body: "Thanks for participating." },
      already_voted: { title: "Already voted", body: "You've already voted in this poll." },
      closed: { title: "Poll closed", body: "This poll is no longer accepting votes." }
    },

    validation: {
      required_field: { title: "Required", body: "Please fill the {field} field." },
      min_length: { title: "Too short", body: "{field} must be at least {min} characters." },
      max_length: { title: "Too long", body: "{field} must be at most {max} characters." },
      invalid_email: { title: "Invalid email", body: "Enter a valid email address." },
      invalid_url: { title: "Invalid URL", body: "Enter a valid URL (e.g., https://...)." },
      passwords_mismatch: { title: "Passwords don't match", body: "Enter the same password in both fields." },
      invalid_credentials: { title: "Invalid credentials", body: "Incorrect email and/or password." }
    },

    geo: {
      permission_denied: { title: "Permission denied", body: "Allow location access to continue." },
      browser_unsupported: { title: "Not supported", body: "Your browser doesn't support geolocation." },
      coords_copied: { title: "Coordinates copied", body: "Latitude/longitude copied to clipboard." }
    },

    presence: {
      check_in_success: { title: "Checked in", body: "Your presence was recorded." },
      check_out_success: { title: "Checked out", body: "Your checkout was recorded." },
      already_checked_in: { title: "Already checked in", body: "You've already checked in." }
    },

    errors: {
      network_offline: { title: "No connection", body: "Check your internet and try again." },
      network_timeout: { title: "Timed out", body: "The request took too long. Try again." },
      unauthorized: { title: "Unauthorized", body: "Please log in to continue." },
      forbidden: { title: "Access denied", body: "You don't have permission for this." },
      not_found: { title: "Not found", body: "The requested resource was not found." },
      rate_limited: { title: "Too many attempts", body: "Please try again shortly." },
      server_error: { title: "Server error", body: "An unexpected error occurred. Try again later." },
      unknown: { title: "Unknown error", body: "Something went wrong. Try again." }
    }
  },

  es: {
    app: { name: "Cristãos App" },
    common: {
      ok: "OK",
      cancel: "Cancelar",
      close: "Cerrar",
      save: "Guardar",
      edit: "Editar",
      retry: "Reintentar",
      continue: "Continuar",
      back: "Volver",
      yes: "Sí",
      no: "No",
      delete: "Eliminar",
      remove: "Quitar",
      change: "Cambiar",
      upload: "Subir",
      login: "Iniciar sesión",
      signup: "Registrarse",
      logout: "Cerrar sesión",
      settings: "Configuraciones",
      manage: "Gestionar",
      enable: "Activar",
      disable: "Desactivar",
      view: "Ver",
      open: "Abrir",
      copy: "Copiar",
      copied: "¡Copiado!",
      report: "Reportar",
      block: "Bloquear",
      unblock: "Desbloquear",
      send: "Enviar",
      accept: "Aceptar",
      reject: "Rechazar"
    },

    auth: {
      login_required_generic: {
        title: "Se requiere inicio de sesión",
        body: "Inicia sesión para continuar."
      },
      login_required_like: {
        title: "Inicia sesión para dar me gusta",
        body: "Debes iniciar sesión para dar me gusta a publicaciones."
      },
      login_required_share: {
        title: "Inicia sesión para compartir",
        body: "Debes iniciar sesión para compartir contenido."
      },
      login_required_comment: {
        title: "Inicia sesión para comentar",
        body: "Inicia sesión para escribir y enviar comentarios."
      },
      login_required_follow: {
        title: "Inicia sesión para agregar amigo",
        body: "Inicia sesión para enviar solicitudes de amistad."
      },
      login_required_message: {
        title: "Inicia sesión para chatear",
        body: "Debes iniciar sesión para iniciar una conversación."
      },
      session_expired: {
        title: "Sesión expirada",
        body: "Inicia sesión nuevamente para continuar."
      },
      email_not_verified: {
        title: "Correo no verificado",
        body: "Verifica tu correo para usar esta función."
      },
      reset_link_sent: {
        title: "Enlace enviado",
        body: "Te enviamos un enlace para restablecer tu contraseña."
      },
      verification_sent: {
        title: "Verificación enviada",
        body: "Te enviamos un enlace de verificación de cuenta."
      }
    },

    actions: {
      like_success: { title: "Te gusta", body: "Te ha gustado esta publicación." },
      like_removed: { title: "Quitado", body: "Has quitado tu me gusta." },
      share_success: { title: "Compartido", body: "Contenido compartido con éxito." },
      share_copied: { title: "Enlace copiado", body: "El enlace se copió al portapapeles." },
      comment_posted: { title: "Comentario publicado", body: "Tu comentario ha sido publicado." },
      comment_deleted: { title: "Comentario eliminado", body: "El comentario fue eliminado." },
      comment_delete_confirm: {
        title: "¿Eliminar comentario?",
        body: "Esta acción no se puede deshacer."
      },
      save_success: { title: "Guardado", body: "Cambios guardados con éxito." },
      save_error: { title: "Error al guardar", body: "No pudimos guardar tus cambios." }
    },

    profile: {
      bio_updated: { title: "Bio actualizada", body: "Tu biografía ha sido guardada." },
      friend_request_sent: { title: "Solicitud enviada", body: "Tu solicitud de amistad ha sido enviada." },
      friend_request_accepted: { title: "Amistad aceptada", body: "Ahora son amigos." },
      friend_removed: { title: "Amigo eliminado", body: "Has eliminado a este amigo." },
      blocked: { title: "Usuario bloqueado", body: "No verás contenido de este usuario." },
      unblocked: { title: "Usuario desbloqueado", body: "Bloqueo eliminado con éxito." },
      cannot_message_self: { title: "No disponible", body: "No puedes enviarte mensajes a ti mismo." }
    },

    listings: {
      create_success: { title: "Publicado", body: "Tu publicación ha sido publicada." },
      update_success: { title: "Actualizado", body: "Tu publicación ha sido actualizada." },
      delete_confirm: { title: "¿Eliminar publicación?", body: "Esta acción no se puede deshacer." },
      delete_success: { title: "Eliminada", body: "Tu publicación ha sido eliminada." },
      delete_error: { title: "Error al eliminar", body: "No pudimos eliminar la publicación." },
      report_confirm: { title: "¿Reportar contenido?", body: "Nuestro equipo revisará el reporte." },
      report_sent: { title: "Reporte enviado", body: "Gracias por ayudar a mantener segura la comunidad." }
    },

    comments: {
      empty_text: { title: "Nada para enviar", body: "Escribe un mensaje antes de enviar." },
      like_login_needed: { title: "Inicia sesión para dar me gusta", body: "Inicia sesión para dar me gusta a comentarios." }
    },

    chat: {
      request_sent: { title: "Invitación enviada", body: "Se envió tu solicitud de chat." },
      request_pending: { title: "Invitación pendiente", body: "Esperando que el otro usuario acepte." },
      request_accepted: { title: "Conversación creada", body: "Ahora pueden chatear." },
      request_rejected: { title: "Invitación rechazada", body: "La invitación fue rechazada." },
      join_error: { title: "Error en el chat", body: "No pudimos unirnos a la conversación." }
    },

    notifications: {
      all_marked_read: { title: "Todo leído", body: "Tus notificaciones fueron marcadas como leídas." },
      mark_read_error: { title: "No se pudo marcar", body: "No pudimos marcar como leídas." },
      email_enabled: { title: "Emails activados", body: "Recibirás notificaciones por correo." },
      email_disabled: { title: "Emails desactivados", body: "No recibirás notificaciones por correo." },
      email_toggle_error: { title: "Error al actualizar", body: "No pudimos cambiar tu preferencia de correo." },
      manage_hint: {
        title: "Gestionar notificaciones",
        body: "Puedes gestionar las preferencias de correo en la página de Notificaciones."
      }
    },

    churches: {
      create_success: { title: "Iglesia registrada", body: "La iglesia se guardó con éxito." },
      update_success: { title: "Iglesia actualizada", body: "Los datos de la iglesia han sido guardados." },
      delete_confirm: { title: "¿Eliminar iglesia?", body: "Esta acción no se puede deshacer." },
      delete_success: { title: "Iglesia eliminada", body: "La iglesia fue eliminada." },
      geocode_start: { title: "Buscando coordenadas", body: "Resolviendo dirección a latitud/longitud..." },
      geocode_success: { title: "Coordenadas encontradas", body: "Latitud y longitud completadas." },
      geocode_error: { title: "Error de geocodificación", body: "No pudimos obtener las coordenadas." },
      gallery_add_success: { title: "Foto añadida", body: "La imagen se añadió a la galería." },
      gallery_remove_confirm: { title: "¿Quitar foto?", body: "La imagen será removida de la galería." },
      gallery_remove_success: { title: "Foto removida", body: "Imagen removida de la galería." },
      statement_upload_success: { title: "PDF subido", body: "Documento adjuntado con éxito." },
      statement_upload_error: { title: "Error al subir", body: "No pudimos adjuntar el documento." }
    },

    uploads: {
      uploading: { title: "Subiendo...", body: "Espera mientras subimos tu archivo." },
      success: { title: "Subida completa", body: "Archivo subido con éxito." },
      error: { title: "Fallo de subida", body: "No pudimos subir el archivo." },
      too_large: { title: "Archivo demasiado grande", body: "El tamaño máximo es {maxMB} MB." },
      invalid_type: { title: "Formato inválido", body: "Formatos aceptados: {types}." }
    },

    mural: {
      posted: { title: "Mensaje publicado", body: "Tu recado fue publicado en el muro." },
      error: { title: "Error al enviar", body: "No pudimos publicar en el muro." }
    },

    polls: {
      vote_success: { title: "Voto registrado", body: "Gracias por participar." },
      already_voted: { title: "Ya votaste", body: "Ya has votado en esta encuesta." },
      closed: { title: "Encuesta cerrada", body: "Esta encuesta ya no acepta votos." }
    },

    validation: {
      required_field: { title: "Campo obligatorio", body: "Completa el campo {field}." },
      min_length: { title: "Demasiado corto", body: "{field} debe tener al menos {min} caracteres." },
      max_length: { title: "Demasiado largo", body: "{field} debe tener como máximo {max} caracteres." },
      invalid_email: { title: "Correo inválido", body: "Introduce un correo válido." },
      invalid_url: { title: "URL inválida", body: "Introduce una URL válida (ej.: https://...)." },
      passwords_mismatch: { title: "Las contraseñas no coinciden", body: "Escribe la misma contraseña en ambos campos." },
      invalid_credentials: { title: "Credenciales inválidas", body: "Correo y/o contraseña incorrectos." }
    },

    geo: {
      permission_denied: { title: "Permiso denegado", body: "Permite acceso a la ubicación para continuar." },
      browser_unsupported: { title: "No compatible", body: "Tu navegador no soporta geolocalización." },
      coords_copied: { title: "Coordenadas copiadas", body: "Latitud/longitud copiadas al portapapeles." }
    },

    presence: {
      check_in_success: { title: "Asistencia registrada", body: "Tu presencia fue registrada." },
      check_out_success: { title: "Salida registrada", body: "Tu salida fue registrada." },
      already_checked_in: { title: "Ya registrado", body: "Ya registraste asistencia." }
    },

    errors: {
      network_offline: { title: "Sin conexión", body: "Verifica tu internet e inténtalo de nuevo." },
      network_timeout: { title: "Tiempo agotado", body: "La solicitud tardó demasiado. Inténtalo de nuevo." },
      unauthorized: { title: "No autorizado", body: "Inicia sesión para continuar." },
      forbidden: { title: "Acceso denegado", body: "No tienes permiso para esto." },
      not_found: { title: "No encontrado", body: "No se encontró el recurso solicitado." },
      rate_limited: { title: "Demasiados intentos", body: "Inténtalo nuevamente en breve." },
      server_error: { title: "Error del servidor", body: "Ocurrió un error inesperado. Inténtalo más tarde." },
      unknown: { title: "Error desconocido", body: "Algo salió mal. Inténtalo de nuevo." }
    }
  }
};

// --- Helpers ---

function get(obj, path) {
  return path.split(".").reduce((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), obj);
}

function format(str, params = {}) {
  if (typeof str !== "string") return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => (params[key] != null ? String(params[key]) : `{${key}}`));
}

/**
 * t(lang, path, params?)
 * Busca a mensagem em `lang`; se não achar, tenta EN; se não achar, devolve o path.
 * Retorna objeto { title, body } (ou string, se o alvo for string simples).
 */
export function t(lang = "en", path, params) {
  const tryLangs = [lang, "en"];
  for (const L of tryLangs) {
    const raw = get(STRINGS[L], path);
    if (raw != null) {
      if (typeof raw === "string") return format(raw, params);
      if (typeof raw === "object") {
        const out = {};
        for (const [k, v] of Object.entries(raw)) out[k] = format(v, params);
        return out;
      }
    }
  }
  // fallback final: mostra o path como texto
  return { title: path, body: "" };
}

export const strings = STRINGS;
